-- Fix stock-deduction race in mark_order_paid by locking product/variant rows.
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
