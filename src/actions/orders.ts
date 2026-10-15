"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema, cartSchema } from "@/lib/validators";
import { generateOrderNumber, normalizeNigerianPhone } from "@/lib/format";
import { verifyPaystackPayment } from "@/lib/paystack";
import { markPaidFromWebhookEvent } from "@/lib/webhook-payment";
import { sendOrderEmails } from "@/lib/email";
import { CartItem, CheckoutFormData, DeliveryZone, Order, OrderItem, Payment } from "@/types";

const PAYSTACK_BASE = "https://api.paystack.co";

// Simple in-memory rate limiters. For production with multiple instances,
// replace with Redis or a database table.
type RateLimitEntry = { count: number; resetAt: number };

function createRateLimiter(windowMs: number, limit: number) {
  const map = new Map<string, RateLimitEntry>();
  return {
    isLimited(ip: string): boolean {
      const now = Date.now();
      const entry = map.get(ip);
      if (!entry || now > entry.resetAt) {
        map.set(ip, { count: 1, resetAt: now + windowMs });
        return false;
      }
      entry.count++;
      return entry.count > limit;
    },
  };
}

const createOrderRateLimit = createRateLimiter(10 * 60 * 1000, 5);
const trackOrderRateLimit = createRateLimiter(10 * 60 * 1000, 10);
const reinitializeRateLimit = createRateLimiter(10 * 60 * 1000, 5);

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidNigerianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (
    (digits.startsWith("0") && digits.length === 11) ||
    (digits.startsWith("234") && digits.length === 13)
  );
}

function validateEmailOrPhone(value: string): { isEmail: boolean; normalized?: string; error?: string } {
  if (value.includes("@")) {
    if (!isValidEmail(value)) {
      return { isEmail: true, error: "Enter a valid email address" };
    }
    return { isEmail: true };
  }

  const normalized = normalizeNigerianPhone(value);
  if (!normalized || !isValidNigerianPhone(normalized)) {
    return { isEmail: false, error: "Enter a valid Nigerian phone number" };
  }
  return { isEmail: false, normalized };
}

type OrderItemInput = {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  unit_price: number | null;
  quantity: number;
};

async function generateUniqueReference(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  let orderNumber = generateOrderNumber();
  let retries = 0;
  while (retries < 10) {
    const [{ data: existingOrder }, { data: existingPayment }] = await Promise.all([
      admin
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .maybeSingle(),
      admin
        .from("payments")
        .select("id")
        .eq("reference", orderNumber)
        .maybeSingle(),
    ]);

    if (!existingOrder && !existingPayment) return orderNumber;
    orderNumber = generateOrderNumber();
    retries++;
  }
  throw new Error("Could not generate unique order number");
}

async function createFreeOrder(
  admin: ReturnType<typeof createAdminClient>,
  formData: CheckoutFormData,
  deliveryZone: DeliveryZone,
  deliveryFee: number,
  orderItems: OrderItemInput[],
  subtotal: number
): Promise<
  | { success: true; orderNumber: string; authorizationUrl: string }
  | { success: false; error: string }
> {
  const orderNumber = await generateUniqueReference(admin);
  const phone = normalizeNigerianPhone(formData.phone);
  const email = formData.email.toLowerCase();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  const { data: order, error: orderError } = await admin.rpc(
    "create_order_with_items_and_payment",
    {
      p_order_number: orderNumber,
      p_customer_name: formData.name,
      p_customer_email: email,
      p_customer_phone: phone,
      p_delivery_location: formData.deliveryAddress,
      p_delivery_zone_id: deliveryZone.id,
      p_delivery_zone_name: deliveryZone.name ?? "",
      p_delivery_fee: deliveryFee,
      p_delivery_quote_pending: !!deliveryZone.quote_after_payment,
      p_notes: formData.notes ?? "",
      p_subtotal: subtotal,
      p_total: 0,
      p_expires_at: expiresAt.toISOString(),
      p_items: orderItems as never,
      p_payment_reference: orderNumber,
      p_payment_amount: 0,
      p_payment_currency: "NGN",
      p_payment_status: "success",
    }
  );

  if (orderError || !order || !order[0]) {
    console.error("createFreeOrder RPC error:", orderError?.message);
    return { success: false, error: "Failed to create order" };
  }

  const createdOrder = order[0];

  await admin.rpc("mark_order_paid", {
    p_order_id: createdOrder.id,
    p_reference: orderNumber,
    p_amount: 0,
    p_channel: "free_order",
    p_txn_id: "free",
    p_raw: {},
  });

  sendOrderEmails(createdOrder.id).catch((err) => {
    console.error("createFreeOrder sendOrderEmails error:", err);
  });

  revalidatePath("/admin/orders");

  return {
    success: true,
    orderNumber,
    authorizationUrl: `${getSiteUrl()}/order/${orderNumber}?token=${createdOrder.public_token}`,
  };
}

export async function createOrder(
  cartItems: CartItem[],
  formData: CheckoutFormData
): Promise<
  | { success: true; orderNumber: string; authorizationUrl: string }
  | { success: false; error: string }
> {
  try {
    // Honeypot check
    if (formData.honeypot && formData.honeypot.length > 0) {
      return { success: false, error: "Bot detected" };
    }

    // Rate limiting
    const ip = await getClientIp();
    if (createOrderRateLimit.isLimited(ip)) {
      return {
        success: false,
        error: "Too many orders. Please try again in 10 minutes.",
      };
    }

    // Validate form
    const validated = checkoutSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((e) => e.message).join(". "),
      };
    }

    const phone = normalizeNigerianPhone(validated.data.phone);
    const email = validated.data.email.toLowerCase();

    const cartValidation = cartSchema.safeParse(cartItems);
    if (!cartValidation.success) {
      return {
        success: false,
        error: cartValidation.error.issues.map((e) => e.message).join(". "),
      };
    }

    const validatedCartItems = cartValidation.data;

    const admin = createAdminClient();

    // Re-fetch products and variants from DB (never trust client prices)
    const productIds = validatedCartItems.map((item) => item.productId);
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("*, variants:product_variants(*)")
      .in("id", productIds)
      .eq("is_active", true);

    if (productsError || !products) {
      return { success: false, error: "Failed to verify products" };
    }

    // Fetch selected delivery zone from DB (never trust client fee)
    const { data: deliveryZone, error: zoneError } = await admin
      .from("delivery_zones")
      .select("*")
      .eq("id", validated.data.deliveryZoneId)
      .eq("is_active", true)
      .single();

    if (zoneError || !deliveryZone) {
      return { success: false, error: "Selected delivery zone is unavailable" };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItems: OrderItemInput[] = [];

    for (const cartItem of validatedCartItems) {
      const product = productMap.get(cartItem.productId);
      if (!product) {
        return {
          success: false,
          error: "A product in your cart is no longer available",
        };
      }

      const variant = cartItem.variantId
        ? product.variants.find((v: { id: string }) => v.id === cartItem.variantId)
        : undefined;

      if (cartItem.variantId && !variant) {
        return { success: false, error: `Variant not found for ${product.name}` };
      }

      if (variant && variant.is_active === false) {
        return {
          success: false,
          error: `${product.name} (${variant.label}) is no longer available`,
        };
      }

      const effectiveStock = variant
        ? variant.stock_quantity
        : product.stock_quantity;
      const trackStock = product.track_stock;

      if (trackStock && cartItem.quantity > effectiveStock) {
        return {
          success: false,
          error: `${product.name} only has ${effectiveStock} in stock`,
        };
      }

      const unitPrice = variant?.price ?? product.price;
      const priceOnRequest = product.price_on_request || unitPrice === null;

      if (priceOnRequest) {
        return {
          success: false,
          error: `${product.name} is price on request and cannot be paid for online. Please request a quote.`,
        };
      }

      subtotal += unitPrice * cartItem.quantity;

      orderItems.push({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: product.name,
        variant_label: variant?.label ?? null,
        unit_price: unitPrice ?? null,
        quantity: cartItem.quantity,
      });
    }

    const deliveryFee = deliveryZone.quote_after_payment ? 0 : deliveryZone.fee;
    const total = subtotal + deliveryFee;

    if (subtotal < 0 || total < 0 || !Number.isFinite(total)) {
      return { success: false, error: "Invalid order total" };
    }

    // Free order: skip Paystack and mark as paid immediately.
    if (total === 0) {
      return createFreeOrder(
        admin,
        validated.data,
        deliveryZone,
        deliveryFee,
        orderItems,
        subtotal
      );
    }

    const amountKobo = Math.round(total * 100);

    let orderNumber: string;
    try {
      orderNumber = await generateUniqueReference(admin);
    } catch {
      return { success: false, error: "Failed to create order. Please try again." };
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Atomically create order, items, and initial payment record.
    const { data: order, error: orderError } = await admin.rpc(
      "create_order_with_items_and_payment",
      {
        p_order_number: orderNumber,
        p_customer_name: validated.data.name,
        p_customer_email: email,
        p_customer_phone: phone,
        p_delivery_location: validated.data.deliveryAddress,
        p_delivery_zone_id: deliveryZone.id,
        p_delivery_zone_name: deliveryZone.name ?? "",
        p_delivery_fee: deliveryFee,
        p_delivery_quote_pending: !!deliveryZone.quote_after_payment,
        p_notes: validated.data.notes ?? "",
        p_subtotal: subtotal,
        p_total: total,
        p_expires_at: expiresAt.toISOString(),
        p_items: orderItems as never,
        p_payment_reference: orderNumber,
        p_payment_amount: total,
        p_payment_currency: "NGN",
      }
    );

    if (orderError || !order || !order[0]) {
      console.error("createOrder RPC error:", orderError?.message);
      return { success: false, error: "Failed to create order" };
    }

    const createdOrder = order[0];

    // Initialize Paystack transaction
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      await admin
        .from("orders")
        .update({ status: "expired", payment_status: "failed", expires_at: new Date().toISOString() })
        .eq("id", createdOrder.id);
      await admin.from("payments").update({ status: "failed" }).eq("reference", orderNumber);
      return { success: false, error: "Payment gateway is not configured" };
    }

    const callbackUrl = `${getSiteUrl()}/order/${orderNumber}?token=${createdOrder.public_token}`;

    const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "NGN",
        reference: orderNumber,
        callback_url: callbackUrl,
        metadata: {
          order_id: createdOrder.id,
          order_number: orderNumber,
          customer_name: validated.data.name,
          phone,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || !paystackData.data?.authorization_url) {
      console.error("Paystack initialize failed:", paystackData);
      await Promise.all([
        admin
          .from("orders")
          .update({ status: "expired", payment_status: "failed", expires_at: new Date().toISOString() })
          .eq("id", createdOrder.id),
        admin
          .from("payments")
          .update({ status: "failed" })
          .eq("reference", orderNumber),
      ]);
      return {
        success: false,
        error: "Could not start payment. Please try again.",
      };
    }

    const authorizationUrl = paystackData.data.authorization_url as string;

    // Save authorization URL for retries
    await admin
      .from("payments")
      .update({ authorization_url: authorizationUrl })
      .eq("reference", orderNumber);

    revalidatePath("/admin/orders");

    return { success: true, orderNumber, authorizationUrl };
  } catch (err) {
    console.error("createOrder error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const ORDER_SELECT = "*, items:order_items(*), payment:payments(*)";

export async function getOrderByToken(orderNumber: string, token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("order_number", orderNumber)
    .eq("public_token", token)
    .single();

  if (error || !data) return null;
  return data;
}

type OrderWithRelations = Order & {
  items: OrderItem[];
  payment: Payment[];
};

export async function refreshOrderStatus(
  orderNumber: string,
  token: string
): Promise<{ success: true; order: OrderWithRelations } | { success: false; error: string }> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("order_number", orderNumber)
    .eq("public_token", token)
    .single();

  if (error || !order) {
    return { success: false, error: "Order not found" };
  }

  // With payment retries, there may be multiple payment rows. Verify the latest one.
  const payment = order.payment?.length
    ? order.payment.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0]
    : undefined;
  const canVerify =
    order.status === "pending_payment" ||
    (order.status === "expired" && order.payment_status !== "paid");
  if (canVerify && payment?.reference && payment.status !== "success") {
    const total = order.total ?? 0;

    // First, check if a Paystack webhook event already confirmed this payment.
    // This avoids hitting the Verify API when Netlify has trouble reaching Paystack.
    const markedFromWebhook = await markPaidFromWebhookEvent(
      payment.reference,
      order.id,
      total
    );

    if (!markedFromWebhook) {
      try {
        const verified = await verifyPaystackPayment(payment.reference);
        if (
          verified.status &&
          verified.data?.status === "success" &&
          verified.data.currency === "NGN" &&
          verified.data.amount === Math.round(total * 100)
        ) {
          await admin.rpc("mark_order_paid", {
            p_order_id: order.id,
            p_reference: payment.reference,
            p_amount: total,
            p_channel: verified.data.channel ?? null,
            p_txn_id: String(verified.data.id),
            p_raw: verified.data as never,
          });
        }
      } catch (err) {
        console.error("refreshOrderStatus verify error:", err);
      }
    }
  }

  const { data: updated } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", order.id)
    .single();

  return { success: true, order: updated as OrderWithRelations };
}

export async function reinitializePayment(
  orderNumber: string,
  token: string
): Promise<
  | { success: true; authorizationUrl: string }
  | { success: false; error: string }
> {
  const ip = await getClientIp();
  if (reinitializeRateLimit.isLimited(ip)) {
    return { success: false, error: "Too many attempts. Please try again in 10 minutes." };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("order_number", orderNumber)
    .eq("public_token", token)
    .single();

  if (error || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== "pending_payment") {
    return { success: false, error: "This order can no longer be paid for" };
  }

  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    await admin
      .from("orders")
      .update({ status: "expired", payment_status: "expired" })
      .eq("id", order.id);
    return { success: false, error: "This order has expired" };
  }

  // Re-validate products, variants, and stock before restarting payment.
  const productIds =
    order.items
      ?.map((item) => item.product_id)
      .filter((id): id is string => id !== null) ?? [];
  const { data: products } = await admin
    .from("products")
    .select("*, variants:product_variants(*)")
    .in("id", productIds)
    .eq("is_active", true);

  const productMap = new Map(products?.map((p) => [p.id, p]) ?? []);

  for (const item of order.items ?? []) {
    if (!item.product_id) continue;

    const product = productMap.get(item.product_id);
    if (!product) {
      return {
        success: false,
        error: "A product in this order is no longer available",
      };
    }

    const variant = item.variant_id
      ? product.variants.find((v: { id: string }) => v.id === item.variant_id)
      : undefined;

    if (item.variant_id && !variant) {
      return { success: false, error: `Variant not found for ${product.name}` };
    }

    if (variant && variant.is_active === false) {
      return {
        success: false,
        error: `${product.name} (${variant.label}) is no longer available`,
      };
    }

    const effectiveStock = variant
      ? variant.stock_quantity
      : product.stock_quantity;

    if (product.track_stock && item.quantity > effectiveStock) {
      return {
        success: false,
        error: `${product.name} only has ${effectiveStock} in stock`,
      };
    }

    const unitPrice = variant?.price ?? product.price;
    if (product.price_on_request || unitPrice === null) {
      return {
        success: false,
        error: `${product.name} is no longer available for online payment`,
      };
    }
  }

  // Extend the expiry window so the customer has time to complete the retry.
  const newExpiresAt = new Date();
  newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 30);
  await admin
    .from("orders")
    .update({ expires_at: newExpiresAt.toISOString() })
    .eq("id", order.id);

  // With retries there may be multiple payment rows. Work with the latest one.
  const latestPayment = order.payment?.length
    ? order.payment.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0]
    : undefined;

  // Reuse the latest authorization URL if available so we don't orphan references.
  if (latestPayment?.authorization_url) {
    return { success: true, authorizationUrl: latestPayment.authorization_url };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: "Payment gateway is not configured" };
  }

  const total = order.total ?? 0;
  if (total <= 0) {
    return { success: false, error: "This order does not require payment" };
  }

  // Generate a new Paystack reference for retries to avoid conflicts.
  let newReference: string;
  try {
    newReference = await generateUniqueReference(admin);
  } catch {
    return { success: false, error: "Could not restart payment. Please try again." };
  }

  const callbackUrl = `${getSiteUrl()}/order/${orderNumber}?token=${order.public_token}`;
  const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: order.customer_email,
      amount: Math.round(total * 100),
      currency: "NGN",
      reference: newReference,
      callback_url: callbackUrl,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        customer_name: order.customer_name,
        phone: order.customer_phone,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.status || !paystackData.data?.authorization_url) {
    return { success: false, error: "Could not restart payment. Please try again." };
  }

  const authorizationUrl = paystackData.data.authorization_url as string;

  // Insert a new payment row so the old reference remains traceable.
  const { error: insertError } = await admin.from("payments").insert({
    order_id: order.id,
    reference: newReference,
    provider: "paystack",
    amount: total,
    currency: "NGN",
    status: "pending",
    authorization_url: authorizationUrl,
    parent_payment_id: latestPayment?.id ?? null,
  });

  if (insertError) {
    console.error("reinitializePayment insert error:", insertError.message);
    return { success: false, error: "Could not restart payment. Please try again." };
  }

  return { success: true, authorizationUrl };
}

export async function trackOrder(formData: FormData) {
  const ip = await getClientIp();
  if (trackOrderRateLimit.isLimited(ip)) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const emailOrPhone = String(formData.get("emailOrPhone") ?? "").trim();

  if (!orderNumber || !emailOrPhone) {
    return { success: false, error: "Enter your order number and email or phone" };
  }

  const validation = validateEmailOrPhone(emailOrPhone);
  if (validation.error) {
    return { success: false, error: validation.error };
  }

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("order_number, public_token, customer_email, customer_phone")
    .eq("order_number", orderNumber);

  if (validation.isEmail) {
    query = query.eq("customer_email", emailOrPhone.toLowerCase());
  } else {
    query = query.eq("customer_phone", validation.normalized!);
  }

  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    // Generic error to avoid revealing whether an order number exists.
    return {
      success: false,
      error: "Order not found. Check your order number and email or phone.",
    };
  }

  return {
    success: true,
    redirectUrl: `/order/${order.order_number}?token=${order.public_token}`,
  };
}
