CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  fee numeric(12,2) NOT NULL DEFAULT 0,
  quote_after_payment boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  provider text DEFAULT 'paystack',
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending',
  channel text,
  paystack_transaction_id text,
  authorization_url text,
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text DEFAULT 'paystack',
  event_key text NOT NULL UNIQUE,
  event_type text,
  payload jsonb,
  processed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (reference);
