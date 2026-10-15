-- Fix storage update policy, delivery zone seed data, and stock helper double-counting.

-- 1. Enforce image extension on storage object updates (matches insert policy).
DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update ON storage.objects
  FOR UPDATE
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin()
    AND storage.extension(name) = ANY (ARRAY['jpg','jpeg','png','webp','gif'])
  );

-- 2. Remove the quote-after-payment zone and ensure every zone has a fixed fee.
-- The application no longer supports delivery-fee quotes after payment.
DELETE FROM delivery_zones WHERE quote_after_payment = true;

-- Ensure remaining zones never quote after payment.
UPDATE delivery_zones SET quote_after_payment = false;

-- Enforce non-negative fees for fixed-fee zones.
ALTER TABLE delivery_zones
  ADD CONSTRAINT chk_delivery_zones_fee_non_negative
  CHECK (fee >= 0);

-- 3. Fix stock helpers so they only update the variant when a variant is supplied,
-- preventing double-counting of sales against parent product stock.
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_quantity INT,
  p_variant_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0)
    WHERE id = p_variant_id;
  ELSE
    UPDATE products
    SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0)
    WHERE id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION restore_stock(
  p_product_id UUID,
  p_quantity INT,
  p_variant_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock_quantity = stock_quantity + p_quantity
    WHERE id = p_variant_id;
  ELSE
    UPDATE products
    SET stock_quantity = stock_quantity + p_quantity
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- Re-apply function grants after recreation.
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_stock(uuid, int, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, int, uuid) TO service_role;
