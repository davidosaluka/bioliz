-- Make earlier constraint additions idempotent and safe for re-runs/production data.
-- Backfill any legacy rows before enforcing stricter constraints.

-- Backfill orders.total before ensuring NOT NULL.
UPDATE orders
SET total = COALESCE(subtotal + COALESCE(delivery_fee, 0), 0)
WHERE total IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE orders ALTER COLUMN total SET NOT NULL;
  END IF;
END $$;

-- Idempotent foreign key from orders to delivery_zones.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_delivery_zone'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_delivery_zone
      FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Idempotent unique constraint on public_token.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_public_token'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT uq_orders_public_token UNIQUE (public_token);
  END IF;
END $$;

-- Idempotent status check constraints.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_payment_status'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_payment_status
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_payments_status'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT chk_payments_status
      CHECK (status IN ('pending', 'success', 'failed', 'refunded'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_enquiries_status'
  ) THEN
    ALTER TABLE enquiries
      ADD CONSTRAINT chk_enquiries_status
      CHECK (status IN ('new', 'in_progress', 'resolved'));
  END IF;
END $$;

-- Non-negative stock constraints. Clamp any invalid legacy values to 0 first.
UPDATE products SET stock_quantity = 0 WHERE stock_quantity < 0;
UPDATE product_variants SET stock_quantity = 0 WHERE stock_quantity < 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_stock_non_negative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT chk_products_stock_non_negative
      CHECK (stock_quantity >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_variants_stock_non_negative'
  ) THEN
    ALTER TABLE product_variants
      ADD CONSTRAINT chk_variants_stock_non_negative
      CHECK (stock_quantity >= 0);
  END IF;
END $$;
