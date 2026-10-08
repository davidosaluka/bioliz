-- Postgres cannot use a newly added enum value in the same transaction that adds it.
-- This migration only adds values; the next migration uses them.

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
