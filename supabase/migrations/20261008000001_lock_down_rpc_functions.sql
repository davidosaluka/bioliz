-- Lock down SECURITY DEFINER functions and fix mark_order_paid payment scoping.
-- These functions bypass RLS and must only be callable by the service role.

-- Recreate mark_order_paid with the payment update scoped to the order.
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

  -- Defensive amount check: the caller should already have verified this,
  -- but the database function should not trust external validation alone.
  IF p_amount IS DISTINCT FROM v_order.total THEN
    UPDATE orders
    SET needs_attention = true,
        attention_reason = format('Payment amount mismatch: received %s, expected %s', p_amount, v_order.total)
    WHERE id = p_order_id;
    RETURN;
  END IF;

  -- Record the successful payment, but only for the referenced order.
  UPDATE payments
  SET status = 'success',
      channel = p_channel,
      paystack_transaction_id = p_txn_id,
      raw = p_raw,
      paid_at = now()
  WHERE reference = p_reference
    AND order_id = p_order_id;

  -- Mark order paid.
  UPDATE orders
  SET payment_status = 'paid',
      status = 'paid',
      paid_at = now(),
      needs_attention = false,
      attention_reason = null
  WHERE id = p_order_id;

  -- Pre-check stock for tracked items while locking rows.
  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity, p.track_stock
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  LOOP
    IF v_item.track_stock THEN
      IF v_item.variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_stock
        FROM product_variants
        WHERE id = v_item.variant_id
        FOR UPDATE;
      ELSE
        SELECT stock_quantity INTO v_stock
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;
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
          SET stock_quantity = GREATEST(stock_quantity - v_item.quantity, 0)
          WHERE id = v_item.variant_id;
        ELSE
          UPDATE products
          SET stock_quantity = GREATEST(stock_quantity - v_item.quantity, 0)
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

-- Revoke public/anonymous execution on all sensitive SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(uuid, text, numeric, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_order_stock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_unpaid_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_stock(uuid, int, uuid) FROM PUBLIC, anon, authenticated;

-- Allow only the service role to invoke application RPC functions.
GRANT EXECUTE ON FUNCTION public.mark_order_paid(uuid, text, numeric, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, int, uuid) TO service_role;

-- expire_unpaid_orders is also invoked by pg_cron as the postgres user.
GRANT EXECUTE ON FUNCTION public.expire_unpaid_orders() TO service_role, postgres;
