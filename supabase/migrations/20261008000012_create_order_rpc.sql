-- Atomic order creation: inserts order, items, and initial payment in one transaction.
CREATE OR REPLACE FUNCTION create_order_with_items_and_payment(
  p_order_number text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_location text,
  p_delivery_zone_id uuid,
  p_delivery_zone_name text,
  p_delivery_fee numeric,
  p_delivery_quote_pending boolean,
  p_notes text,
  p_subtotal numeric,
  p_total numeric,
  p_expires_at timestamptz,
  p_items jsonb,
  p_payment_reference text,
  p_payment_amount numeric,
  p_payment_currency text DEFAULT 'NGN',
  p_payment_status text DEFAULT 'pending'
) RETURNS TABLE(id uuid, order_number text, public_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_order_number text;
  v_public_token uuid;
BEGIN
  INSERT INTO orders (
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    delivery_location,
    delivery_zone_id,
    delivery_zone_name,
    delivery_fee,
    delivery_quote_pending,
    notes,
    subtotal,
    total,
    payment_status,
    status,
    expires_at
  ) VALUES (
    p_order_number,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_delivery_location,
    p_delivery_zone_id,
    p_delivery_zone_name,
    p_delivery_fee,
    p_delivery_quote_pending,
    p_notes,
    p_subtotal,
    p_total,
    'pending',
    'pending_payment',
    p_expires_at
  )
  RETURNING orders.id, orders.order_number, orders.public_token
  INTO v_id, v_order_number, v_public_token;

  INSERT INTO order_items (
    order_id,
    product_id,
    variant_id,
    product_name,
    variant_label,
    unit_price,
    quantity
  )
  SELECT
    v_id,
    (item.value->>'product_id')::uuid,
    NULLIF(item.value->>'variant_id', '')::uuid,
    item.value->>'product_name',
    NULLIF(item.value->>'variant_label', ''),
    (item.value->>'unit_price')::numeric,
    (item.value->>'quantity')::int
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO payments (
    order_id,
    reference,
    provider,
    amount,
    currency,
    status
  ) VALUES (
    v_id,
    p_payment_reference,
    'paystack',
    p_payment_amount,
    p_payment_currency,
    p_payment_status
  );

  RETURN QUERY SELECT v_id, v_order_number, v_public_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_with_items_and_payment(
  text, text, text, text, text, uuid, text, numeric, boolean, text,
  numeric, numeric, timestamptz, jsonb, text, numeric, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_with_items_and_payment(
  text, text, text, text, text, uuid, text, numeric, boolean, text,
  numeric, numeric, timestamptz, jsonb, text, numeric, text, text
) TO service_role;
