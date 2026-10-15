-- Support an immutable payment history. Retries insert a new payments row
-- linked to the previous one via parent_payment_id.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS parent_payment_id uuid REFERENCES payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_parent_id ON payments (parent_payment_id);
