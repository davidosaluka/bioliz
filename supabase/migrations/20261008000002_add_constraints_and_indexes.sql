-- Add missing foreign keys, unique constraints, indexes and check constraints.

-- Foreign key from orders to delivery_zones. Use SET NULL so historical orders
-- survive zone deletion.
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_delivery_zone
  FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id)
  ON DELETE SET NULL;

-- public_token is used as a bearer token for customer order pages.
ALTER TABLE orders
  ADD CONSTRAINT uq_orders_public_token UNIQUE (public_token);

-- orders.total should never be NULL.
ALTER TABLE orders
  ALTER COLUMN total SET NOT NULL;

-- Status columns should only contain known values.
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_payment_status
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded'));

ALTER TABLE payments
  ADD CONSTRAINT chk_payments_status
  CHECK (status IN ('pending', 'success', 'failed', 'refunded'));

ALTER TABLE enquiries
  ADD CONSTRAINT chk_enquiries_status
  CHECK (status IN ('new', 'in_progress', 'resolved'));

-- Indexes for commonly joined / filtered columns.
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items (variant_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_orders_needs_attention ON orders (needs_attention) WHERE needs_attention = true;

CREATE INDEX IF NOT EXISTS idx_products_price_active ON products (price) WHERE is_active = true AND price_on_request = false;
CREATE INDEX IF NOT EXISTS idx_products_created_active ON products (created_at DESC) WHERE is_active = true;
