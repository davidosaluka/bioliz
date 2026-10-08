-- Enable pg_cron if available (Supabase free tier includes it).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- mark_order_paid: idempotent stock deduction after verified payment.
CREATE OR REPLACE FUNCTION mark_order_paid(
  p_order_id uuid,
  p_reference text,
  p_amount numeric,
  p_channel text,
  p_txn_id text,
  p_raw jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item record;
  v_stock integer;
  v_all_deducted boolean := true;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Idempotent: already paid.
  IF v_order.payment_status = 'paid' THEN
    RETURN;
  END IF;

  -- Record the successful payment.
  UPDATE payments
  SET status = 'success',
      channel = p_channel,
      paystack_transaction_id = p_txn_id,
      raw = p_raw,
      paid_at = now()
  WHERE reference = p_reference;

  -- Mark order paid.
  UPDATE orders
  SET payment_status = 'paid',
      status = 'paid',
      paid_at = now(),
      needs_attention = false,
      attention_reason = null
  WHERE id = p_order_id;

  -- Pre-check stock for tracked items.
  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity, p.track_stock
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  LOOP
    IF v_item.track_stock THEN
      IF v_item.variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_stock FROM product_variants WHERE id = v_item.variant_id;
      ELSE
        SELECT stock_quantity INTO v_stock FROM products WHERE id = v_item.product_id;
      END IF;

      IF v_stock IS NULL OR v_stock < v_item.quantity THEN
        v_all_deducted := false;
        EXIT;
      END IF;
    END IF;
  END LOOP;

  IF v_all_deducted THEN
    FOR v_item IN
      SELECT oi.product_id, oi.variant_id, oi.quantity, p.track_stock
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = p_order_id
    LOOP
      IF v_item.track_stock THEN
        IF v_item.variant_id IS NOT NULL THEN
          UPDATE product_variants
          SET stock_quantity = stock_quantity - v_item.quantity
          WHERE id = v_item.variant_id;
        ELSE
          UPDATE products
          SET stock_quantity = stock_quantity - v_item.quantity
          WHERE id = v_item.product_id;
        END IF;
      END IF;
    END LOOP;

    UPDATE orders SET stock_deducted = true WHERE id = p_order_id;
  ELSE
    UPDATE orders
    SET needs_attention = true,
        attention_reason = 'Insufficient stock after payment: refund or restock'
    WHERE id = p_order_id;
  END IF;
END;
$$;

-- expire_unpaid_orders: fallback SQL cleanup for stale pending orders.
CREATE OR REPLACE FUNCTION expire_unpaid_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders
  SET status = 'expired',
      payment_status = 'expired'
  WHERE status = 'pending_payment'
    AND expires_at < now();
END;
$$;

-- restore_order_stock: used when a paid order is cancelled or refunded.
CREATE OR REPLACE FUNCTION restore_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
BEGIN
  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity, p.track_stock
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    IF v_item.track_stock THEN
      IF v_item.variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock_quantity = stock_quantity + v_item.quantity
        WHERE id = v_item.variant_id;
      ELSE
        UPDATE products
        SET stock_quantity = stock_quantity + v_item.quantity
        WHERE id = v_item.product_id;
      END IF;
    END IF;
  END LOOP;

  UPDATE orders SET stock_deducted = false WHERE id = p_order_id;
END;
$$;

-- Row Level Security
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delivery_zones_public_select ON delivery_zones;
CREATE POLICY delivery_zones_public_select ON delivery_zones
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS delivery_zones_admin_all ON delivery_zones;
CREATE POLICY delivery_zones_admin_all ON delivery_zones
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS payments_admin_select ON payments;
CREATE POLICY payments_admin_select ON payments
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS webhook_events_admin_select ON webhook_events;
CREATE POLICY webhook_events_admin_select ON webhook_events
  FOR SELECT
  USING (is_admin());

-- Seed delivery zones (placeholder fees; vendor edits in admin).
INSERT INTO delivery_zones (name, description, fee, quote_after_payment, sort_order)
VALUES
  ('Lagos Island', 'Ikoyi, Victoria Island, Lekki Phase 1', 3500, false, 1),
  ('Lagos Mainland', 'Ikeja, Yaba, Surulere, Maryland', 4500, false, 2),
  ('Ajah / Lekki-Epe Corridor', 'Ajah, Sangotedo, Lakowe, Epe', 5500, false, 3),
  ('Other location', 'Delivery cost will be quoted after payment', 0, true, 4)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  fee = EXCLUDED.fee,
  quote_after_payment = EXCLUDED.quote_after_payment,
  sort_order = EXCLUDED.sort_order;

-- Schedule expiry cleanup every 10 minutes.
SELECT cron.schedule(
  'expire-unpaid-orders',
  '*/10 * * * *',
  'SELECT expire_unpaid_orders()'
);
