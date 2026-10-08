ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS delivery_zone_id uuid,
  ADD COLUMN IF NOT EXISTS delivery_zone_name text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_quote_pending boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS total numeric(12,2),
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS needs_attention boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS attention_reason text,
  ADD COLUMN IF NOT EXISTS stock_deducted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vendor_email_sent boolean DEFAULT false;

-- New orders start in pending_payment.
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_payment';

-- Legacy column kept for old rows but no longer populated by the app.

CREATE INDEX IF NOT EXISTS idx_orders_status_expires ON orders (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON orders (public_token);
