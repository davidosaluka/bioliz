-- Fix the storage UPDATE policy so it restricts which existing rows can be targeted.
DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin()
    AND storage.extension(name) = ANY (ARRAY['jpg','jpeg','png','webp','gif'])
  );
