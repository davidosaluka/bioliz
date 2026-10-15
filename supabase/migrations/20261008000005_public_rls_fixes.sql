-- Public RLS policies for guest checkout flows.
-- The application currently uses the service-role client for these reads, but these
-- policies provide defense-in-depth and enable future migration to anon clients.

-- Public order lookup by bearer token (passed via x-public-token header).
DROP POLICY IF EXISTS orders_public_select ON orders;
CREATE POLICY orders_public_select ON orders
  FOR SELECT TO anon, authenticated
  USING (
    public_token = COALESCE(
      (current_setting('request.headers', true)::jsonb ->> 'x-public-token')::uuid,
      NULL
    )
  );

-- Public order-items lookup when the parent order is accessible.
DROP POLICY IF EXISTS order_items_public_select ON order_items;
CREATE POLICY order_items_public_select ON order_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.public_token = COALESCE(
          (current_setting('request.headers', true)::jsonb ->> 'x-public-token')::uuid,
          NULL
        )
    )
  );

-- Public enquiry submissions.
DROP POLICY IF EXISTS enquiries_public_insert ON enquiries;
CREATE POLICY enquiries_public_insert ON enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new');
