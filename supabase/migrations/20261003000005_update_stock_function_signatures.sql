-- Update existing stock helpers so p_variant_id is explicitly nullable.
-- Drop the old signatures first to avoid overloaded duplicates.
DROP FUNCTION IF EXISTS decrement_stock(UUID, UUID, INT);
DROP FUNCTION IF EXISTS restore_stock(UUID, UUID, INT);

-- Reordered so p_variant_id can have a default without affecting p_quantity.
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT, p_variant_id UUID DEFAULT NULL)
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
  END IF;

  UPDATE products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION restore_stock(p_product_id UUID, p_quantity INT, p_variant_id UUID DEFAULT NULL)
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
  END IF;

  UPDATE products
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_product_id;
END;
$$;
