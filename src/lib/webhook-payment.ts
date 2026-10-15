import { createAdminClient } from "@/lib/supabase/admin";

export async function markPaidFromWebhookEvent(
  reference: string,
  orderId: string,
  orderTotal: number
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: webhookEvent } = await admin
    .from("webhook_events")
    .select("payload")
    .eq("event_type", "charge.success")
    .filter("payload->data->>reference", "eq", reference)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!webhookEvent) {
    return false;
  }

  const payload = webhookEvent.payload as Record<string, unknown>;
  const data = (payload.data ?? {}) as Record<string, unknown>;

  const amountKobo = Number(data.amount);
  const currency = String(data.currency ?? "");
  const expectedKobo = Math.round(orderTotal * 100);

  if (amountKobo !== expectedKobo || currency !== "NGN") {
    console.error(
      `Webhook event amount/currency mismatch for ${reference}: ${amountKobo} ${currency} vs ${expectedKobo} NGN`
    );
    return false;
  }

  console.log(`Marking order ${orderId} paid from webhook event for ${reference}`);
  const { error } = await admin.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_reference: reference,
    p_amount: orderTotal,
    p_channel: String(data.channel ?? ""),
    p_txn_id: String(data.id ?? ""),
    p_raw: data as never,
  });

  if (error) {
    console.error("markPaidFromWebhookEvent error:", error);
    return false;
  }

  return true;
}
