-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin allow-list
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER SET SEARCH_PATH = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  price NUMERIC(12,2),
  compare_at_price NUMERIC(12,2),
  price_on_request BOOLEAN DEFAULT FALSE,
  stock_quantity INT NOT NULL DEFAULT 0,
  track_stock BOOLEAN DEFAULT TRUE,
  images TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price NUMERIC(12,2),
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Order status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('new', 'contacted', 'confirmed', 'completed', 'cancelled');
  END IF;
END$$;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  notes TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  has_price_on_request BOOLEAN DEFAULT FALSE,
  status order_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT,
  unit_price NUMERIC(12,2),
  quantity INT NOT NULL CHECK (quantity > 0)
);

-- Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  organisation TEXT,
  buyer_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings (single row)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT DEFAULT 'Store Name',
  whatsapp_number TEXT,
  contact_email TEXT,
  address TEXT,
  hero_title TEXT DEFAULT 'BUILD YOUR SPACE. TRAIN HARDER. PLAY BETTER.',
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products (is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(short_description, '')));

-- Updated at trigger for products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed categories
INSERT INTO categories (name, slug, description, sort_order)
VALUES
  ('Gym & Fitness Equipment', 'gym-fitness-equipment', 'Weights, benches, racks and strength training equipment', 1),
  ('Gym Bikes & Cardio Equipment', 'gym-bikes-cardio-equipment', 'Spin bikes, treadmills, ellipticals and cardio machines', 2),
  ('Snooker Tables', 'snooker-tables', 'Professional and home snooker tables and accessories', 3),
  ('Table Tennis Tables', 'table-tennis-tables', 'Indoor and outdoor table tennis tables', 4),
  ('Sports Equipment', 'sports-equipment', 'Football, basketball, volleyball and general sports gear', 5),
  ('Recreational Equipment & More', 'recreational-equipment-more', 'Game room and recreational equipment', 6)
ON CONFLICT (slug) DO NOTHING;

-- Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Admins: only admins can select their own row
DROP POLICY IF EXISTS admins_admin_all ON admins;
CREATE POLICY admins_admin_all ON admins
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Categories
DROP POLICY IF EXISTS categories_public_select ON categories;
CREATE POLICY categories_public_select ON categories
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS categories_admin_all ON categories;
CREATE POLICY categories_admin_all ON categories
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Products
DROP POLICY IF EXISTS products_public_select ON products;
CREATE POLICY products_public_select ON products
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS products_admin_all ON products;
CREATE POLICY products_admin_all ON products
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Product variants
DROP POLICY IF EXISTS product_variants_public_select ON product_variants;
CREATE POLICY product_variants_public_select ON product_variants
  FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS product_variants_admin_all ON product_variants;
CREATE POLICY product_variants_admin_all ON product_variants
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Site settings
DROP POLICY IF EXISTS site_settings_public_select ON site_settings;
CREATE POLICY site_settings_public_select ON site_settings
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS site_settings_admin_update ON site_settings;
CREATE POLICY site_settings_admin_update ON site_settings
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Orders / order items
DROP POLICY IF EXISTS orders_admin_all ON orders;
CREATE POLICY orders_admin_all ON orders
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS order_items_admin_all ON order_items;
CREATE POLICY order_items_admin_all ON order_items
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Enquiries
DROP POLICY IF EXISTS enquiries_admin_all ON enquiries;
CREATE POLICY enquiries_admin_all ON enquiries
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS product_images_public_select ON storage.objects;
CREATE POLICY product_images_public_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
CREATE POLICY product_images_admin_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin()
    AND (storage.extension(name) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif']))
    AND (storage.foldername(name)) IS NOT NULL
  );

DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin())
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
CREATE POLICY product_images_admin_delete ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- Stock adjustment helpers
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_variant_id UUID, p_quantity INT)
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

CREATE OR REPLACE FUNCTION restore_stock(p_product_id UUID, p_variant_id UUID, p_quantity INT)
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
