-- Harden delivery zones now that quote-after-payment support has been removed.
-- The previously deleted quote-after-payment zones must be recreated manually in admin.

-- Ensure no remaining zones quote after payment.
UPDATE delivery_zones SET quote_after_payment = false WHERE quote_after_payment IS NOT TRUE;

-- Prevent future quote-after-payment zones at the database level.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_delivery_zones_no_quote_after_payment'
  ) THEN
    ALTER TABLE delivery_zones
      ADD CONSTRAINT chk_delivery_zones_no_quote_after_payment
      CHECK (quote_after_payment IS NOT TRUE);
  END IF;
END $$;
