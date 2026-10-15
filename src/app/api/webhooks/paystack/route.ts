import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmails } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (expected.length !== signature.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifySignature(rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const event = String(payload.event ?? "unknown");
  const data = (payload.data ?? {}) as Record<string, unknown>;

  // Deterministic idempotency key: hash the entire raw body so duplicate
  // webhooks from Paystack are reliably deduplicated.
  const eventKey = crypto.createHash("sha256").update(rawBody).digest("hex");

  const admin = createAdminClient();

  // Idempotency: ignore duplicate events, fail loudly on real errors.
  const { error: insertEventError } = await admin
    .from("webhook_events")
    .insert({
      provider: "paystack",
      event_key: eventKey,
      event_type: event,
      payload: payload as never,
    });

  if (insertEventError) {
    if (insertEventError.code === "23505") {
      // Unique violation: already processed.
      return new Response("OK", { status: 200 });
    }

    console.error("Webhook: failed to record event", insertEventError);
    return new Response("Internal server error", { status: 500 });
  }

  if (event === "charge.success") {
    const reference = String(data.reference ?? "");
    if (!reference) {
      return new Response("OK", { status: 200 });
    }

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("*, order:orders(*)")
      .eq("reference", reference)
      .single();

    if (paymentError || !payment) {
      console.error("Webhook: payment not found for reference", reference);
      return new Response("OK", { status: 200 });
    }

    const order = Array.isArray(payment.order) ? payment.order[0] : payment.order;
    if (!order) {
      return new Response("OK", { status: 200 });
    }

    const amountKobo = Number(data.amount);
    const currency = String(data.currency ?? "");
    const expectedKobo = Math.round((order.total ?? 0) * 100);

    if (amountKobo !== expectedKobo || currency !== "NGN") {
      console.error(
        `Webhook amount/currency mismatch for ${reference}: ${amountKobo} ${currency} vs ${expectedKobo} NGN`
      );
      await admin
        .from("orders")
        .update({
          needs_attention: true,
          attention_reason: `Webhook amount/currency mismatch: ${amountKobo} ${currency} vs ${expectedKobo} NGN`,
        })
        .eq("id", order.id);
      return new Response("OK", { status: 200 });
    }

    if (data.status !== "success") {
      console.error(`Webhook charge.success status not success for ${reference}:`, data.status);
      return new Response("OK", { status: 200 });
    }

    // The webhook payload is already HMAC-verified by Paystack, so we trust it
    // and mark the order paid without calling the Verify API. This avoids
    // Netlify function timeouts when the Verify API is slow or unreachable.
    console.log(`Webhook marking order ${order.id} as paid for reference ${reference}`);
    const { error: markPaidError } = await admin.rpc("mark_order_paid", {
      p_order_id: order.id,
      p_reference: reference,
      p_amount: order.total ?? 0,
      p_channel: String(data.channel ?? ""),
      p_txn_id: String(data.id ?? ""),
      p_raw: data as never,
    });

    if (markPaidError) {
      console.error("Webhook mark_order_paid error:", markPaidError);
      return new Response("Internal server error", { status: 500 });
    }

    // Send emails outside the critical response path.
    sendOrderEmails(order.id).catch((err) => {
      console.error("Webhook sendOrderEmails error:", err);
    });
  }

  if (event === "charge.failed") {
    const reference = String(data.reference ?? "");
    if (reference) {
      const { data: payment } = await admin
        .from("payments")
        .select("order_id, status")
        .eq("reference", reference)
        .single();

      // Never overwrite a successful payment with a late failed event.
      if (payment && payment.status !== "success") {
        await admin
          .from("payments")
          .update({ status: "failed" })
          .eq("reference", reference);

        if (payment.order_id) {
          await admin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", payment.order_id)
            .eq("payment_status", "pending");
        }
      }
    }
  }

  if (event === "refund.processed") {
    const reference = String(data.transaction_reference ?? "");
    if (reference) {
      await admin
        .from("payments")
        .update({ status: "refunded" })
        .eq("reference", reference);
    }
  }

  return new Response("OK", { status: 200 });
}
