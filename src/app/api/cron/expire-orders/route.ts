import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackPayment } from "@/lib/paystack";
import { sendOrderEmails } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isValid =
    authHeader !== null &&
    authHeader.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pendingOrders, error } = await admin
    .from("orders")
    .select("*, payment:payments(*)")
    .eq("status", "pending_payment")
    .lt("expires_at", new Date().toISOString());

  if (error) {
    console.error("expire-orders query error:", error.message);
    return new Response("Internal error", { status: 500 });
  }

  let paidCount = 0;
  let expiredCount = 0;

  for (const order of pendingOrders ?? []) {
    const payment = Array.isArray(order.payment)
      ? order.payment[0]
      : order.payment;

    let wasPaid = false;

    if (payment?.reference) {
      try {
        const verified = await verifyPaystackPayment(payment.reference);
        if (
          verified.status &&
          verified.data?.status === "success" &&
          verified.data.currency === "NGN" &&
          verified.data.amount === Math.round((order.total ?? 0) * 100)
        ) {
          await admin.rpc("mark_order_paid", {
            p_order_id: order.id,
            p_reference: payment.reference,
            p_amount: order.total ?? 0,
            p_channel: verified.data.channel ?? null,
            p_txn_id: String(verified.data.id),
            p_raw: verified.data as never,
          });

          sendOrderEmails(order.id).catch((err) => {
            console.error("expire-orders sendOrderEmails error:", err);
          });

          wasPaid = true;
          paidCount++;
        }
      } catch (err) {
        console.error("expire-orders verify error:", err);
      }
    }

    if (!wasPaid) {
      await admin
        .from("orders")
        .update({ status: "expired", payment_status: "expired" })
        .eq("id", order.id);
      expiredCount++;
    }
  }

  // Final fallback cleanup in case any slipped through.
  await admin.rpc("expire_unpaid_orders");

  return Response.json({
    success: true,
    paid: paidCount,
    expired: expiredCount,
  });
}
