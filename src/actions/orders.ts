"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema, cartSchema } from "@/lib/validators";
import { generateOrderNumber, normalizeNigerianPhone } from "@/lib/format";
import { verifyPaystackPayment } from "@/lib/paystack";
import { sendOrderEmails } from "@/lib/email";
import { CartItem, CheckoutFormData, DeliveryZone, Order, OrderItem, Payment } from "@/types";

const PAYSTACK_BASE = "https://api.paystack.co";

// Simple in-memory rate limiter. For production with multiple instances,
// replace with Redis or a database table.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const limit = 5;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
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
    const { data: existing } = await admin
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!existing) return orderNumber;
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
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: phone,
      delivery_location: formData.deliveryAddress,
      delivery_zone_id: deliveryZone.id,
      delivery_zone_name: deliveryZone.name,
      delivery_fee: deliveryFee,
      delivery_quote_pending: deliveryZone.quote_after_payment,
      notes: formData.notes ?? null,
      subtotal,
      total: 0,
      payment_status: "pending",
      status: "pending_payment",
      expires_at: expiresAt.toISOString(),
    })
    .select("id, public_token")
    .single();

  if (orderError || !order) {
    console.error("createFreeOrder insert error:", orderError?.message);
    return { success: false, error: "Failed to create order" };
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))
  );

  if (itemsError) {
    console.error("createFreeOrder items error:", itemsError.message);
    await admin.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Failed to save order items" };
  }

  const { error: paymentError } = await admin.from("payments").insert({
    order_id: order.id,
    reference: orderNumber,
    provider: "paystack",
    amount: 0,
    currency: "NGN",
    status: "success",
    paid_at: new Date().toISOString(),
  });

  if (paymentError) {
    console.error("createFreeOrder payment error:", paymentError.message);
    await admin.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Failed to record payment" };
  }

  await admin.rpc("mark_order_paid", {
    p_order_id: order.id,
    p_reference: orderNumber,
    p_amount: 0,
    p_channel: "free_order",
    p_txn_id: "free",
    p_raw: {},
  });

  sendOrderEmails(order.id).catch((err) => {
    console.error("createFreeOrder sendOrderEmails error:", err);
  });

  revalidatePath("/admin/orders");

  return {
    success: true,
    orderNumber,
    authorizationUrl: `${getSiteUrl()}/order/${orderNumber}?token=${order.public_token}`,
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
    if (isRateLimited(ip)) {
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

    // Insert order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: validated.data.name,
        customer_email: validated.data.email,
        customer_phone: phone,
        delivery_location: validated.data.deliveryAddress,
        delivery_zone_id: deliveryZone.id,
        delivery_zone_name: deliveryZone.name,
        delivery_fee: deliveryFee,
        delivery_quote_pending: deliveryZone.quote_after_payment,
        notes: validated.data.notes ?? null,
        subtotal,
        total,
        payment_status: "pending",
        status: "pending_payment",
        expires_at: expiresAt.toISOString(),
      })
      .select("id, public_token")
      .single();

    if (orderError || !order) {
      console.error("createOrder insert error:", orderError?.message);
      return { success: false, error: "Failed to create order" };
    }

    // Insert order items
    const { error: itemsError } = await admin.from("order_items").insert(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      }))
    );

    if (itemsError) {
      console.error("createOrder items error:", itemsError.message);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Failed to save order items" };
    }

    // Insert payment record
    const { error: paymentError } = await admin.from("payments").insert({
      order_id: order.id,
      reference: orderNumber,
      provider: "paystack",
      amount: total,
      currency: "NGN",
      status: "pending",
    });

    if (paymentError) {
      console.error("createOrder payment error:", paymentError.message);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Failed to initialize payment" };
    }

    // Initialize Paystack transaction
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Payment gateway is not configured" };
    }

    const callbackUrl = `${getSiteUrl()}/order/${orderNumber}?token=${order.public_token}`;

    const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: validated.data.email,
        amount: amountKobo,
        currency: "NGN",
        reference: orderNumber,
        callback_url: callbackUrl,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          customer_name: validated.data.name,
          phone,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || !paystackData.data?.authorization_url) {
      console.error("Paystack initialize failed:", paystackData);
      await admin
        .from("orders")
        .update({ status: "expired", payment_status: "failed" })
        .eq("id", order.id);
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

  const payment = order.payment?.[0];
  const canVerify =
    order.status === "pending_payment" ||
    (order.status === "expired" && order.payment_status !== "paid");
  if (canVerify && payment?.reference) {
    try {
      const verified = await verifyPaystackPayment(payment.reference);
      const total = order.total ?? 0;
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

  const payment = order.payment?.[0];
  // Reuse existing authorization URL if available.
  if (payment?.authorization_url) {
    return { success: true, authorizationUrl: payment.authorization_url };
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

  // Update the existing payment record with the new reference and URL.
  if (payment?.id) {
    await admin
      .from("payments")
      .update({ reference: newReference, authorization_url: authorizationUrl })
      .eq("id", payment.id);
  } else {
    await admin
      .from("payments")
      .insert({
        order_id: order.id,
        reference: newReference,
        provider: "paystack",
        amount: total,
        currency: "NGN",
        status: "pending",
        authorization_url: authorizationUrl,
      });
  }

  return { success: true, authorizationUrl };
}

export async function trackOrder(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const emailOrPhone = String(formData.get("emailOrPhone") ?? "").trim();

  if (!orderNumber || !emailOrPhone) {
    return { success: false, error: "Enter your order number and email or phone" };
  }

  const isEmail = emailOrPhone.includes("@");
  const normalizedPhone = isEmail
    ? undefined
    : normalizeNigerianPhone(emailOrPhone);

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("order_number, public_token, customer_email, customer_phone")
    .eq("order_number", orderNumber);

  if (isEmail) {
    query = query.eq("customer_email", emailOrPhone);
  } else {
    query = query.eq("customer_phone", normalizedPhone ?? emailOrPhone);
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
