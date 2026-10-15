-- Harden restore_order_stock so stock is only restored for cancelled/refunded orders.
CREATE OR REPLACE FUNCTION restore_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item record;
BEGIN
  -- Lock the order row and verify it is in a state that should have stock restored.
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order.status NOT IN ('cancelled', 'refunded') THEN
    RETURN;
  END IF;

  IF NOT v_order.stock_deducted THEN
    RETURN;
  END IF;

  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity, p.track_stock
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    IF v_item.track_stock THEN
      IF v_item.variant_id IS NOT NULL THEN
        PERFORM 1 FROM product_variants WHERE id = v_item.variant_id FOR UPDATE;
        UPDATE product_variants
        SET stock_quantity = stock_quantity + v_item.quantity
        WHERE id = v_item.variant_id;
      ELSE
        PERFORM 1 FROM products WHERE id = v_item.product_id FOR UPDATE;
        UPDATE products
        SET stock_quantity = stock_quantity + v_item.quantity
        WHERE id = v_item.product_id;
      END IF;
    END IF;
  END LOOP;

  UPDATE orders SET stock_deducted = false WHERE id = p_order_id;
END;
$$;

-- Re-apply grants after recreation.
REVOKE EXECUTE ON FUNCTION public.restore_order_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(uuid) TO service_role;
