import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackPayment } from "@/lib/paystack";
import { markPaidFromWebhookEvent } from "@/lib/webhook-payment";
import { sendOrderEmails } from "@/lib/email";
import { createMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/data";
import { getStoreName } from "@/lib/site";
import { OrderConfirmationClient } from "@/components/store/order-confirmation-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);
  return createMetadata({
    title: `Order ${orderNumber}`,
    description: `View your order status and receipt from ${storeName}.`,
    path: `/order/${orderNumber}`,
    settings,
  });
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderNumber } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("*, items:order_items(*), payment:payments(*)")
    .eq("order_number", orderNumber)
    .eq("public_token", token)
    .single();

  if (error || !order) {
    notFound();
  }

  // If still pending, verify with Paystack in case the customer returned before
  // the webhook arrived. Always use the latest payment row in case of retries.
  const payment = order.payment?.length
    ? order.payment.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0]
    : undefined;
  const canVerify =
    order.status === "pending_payment" ||
    (order.status === "expired" && order.payment_status !== "paid");
  if (canVerify && payment?.reference) {
    const total = order.total ?? 0;

    // First try to mark paid from an already-received Paystack webhook event.
    // This is more reliable when the Verify API is unreachable from Netlify.
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

          sendOrderEmails(order.id).catch((err) => {
            console.error("OrderPage sendOrderEmails error:", err);
          });
        }
      } catch (err) {
        console.error("OrderPage verify error:", err);
      }
    } else {
      sendOrderEmails(order.id).catch((err) => {
        console.error("OrderPage sendOrderEmails error:", err);
      });
    }
  }

  // Re-fetch to include any changes from the verify step.
  const { data: refreshedOrder } = await admin
    .from("orders")
    .select("*, items:order_items(*), payment:payments(*)")
    .eq("id", order.id)
    .single();

  return <OrderConfirmationClient order={refreshedOrder ?? order} />;
}
