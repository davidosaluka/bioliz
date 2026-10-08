-- Seed sample products
-- Note: images are placeholders; replace with real URLs after upload.

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'gym-fitness-equipment'),
  'Olympic Barbell 20kg',
  'olympic-barbell-20kg',
  'Professional 20kg Olympic barbell for strength training.',
  'Chrome-plated Olympic barbell with knurled grip and rotating sleeves. Perfect for home gyms and commercial facilities.',
  85000,
  95000,
  FALSE,
  12,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Olympic+Barbell'],
  '{"Weight":"20kg","Length":"2.2m","Capacity":"700kg"}'::jsonb,
  TRUE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'olympic-barbell-20kg');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'gym-fitness-equipment'),
  'Adjustable Dumbbell Set',
  'adjustable-dumbbell-set',
  '5kg to 40kg adjustable dumbbell pair.',
  'Quick-change adjustable dumbbells that replace a full rack. Space-saving and ideal for home workouts.',
  145000,
  165000,
  FALSE,
  8,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Adjustable+Dumbbell'],
  '{"Range":"5kg - 40kg","Material":"Cast iron","Pair":"Yes"}'::jsonb,
  TRUE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'adjustable-dumbbell-set');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'gym-bikes-cardio-equipment'),
  'Commercial Spin Bike',
  'commercial-spin-bike',
  'Heavy-duty spin bike for commercial gyms.',
  'Belt-driven commercial spin bike with magnetic resistance, digital monitor and heavy flywheel.',
  320000,
  350000,
  FALSE,
  5,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Spin+Bike'],
  '{"Flywheel":"20kg","Resistance":"Magnetic","Max User":"150kg"}'::jsonb,
  TRUE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'commercial-spin-bike');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'gym-bikes-cardio-equipment'),
  'Treadmill Pro 5.0',
  'treadmill-pro-5-0',
  'Motorised treadmill with incline and shock absorption.',
  'Feature-packed treadmill with adjustable incline, heart-rate sensors, foldable design and preset workout programs.',
  485000,
  520000,
  FALSE,
  3,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Treadmill'],
  '{"Motor":"3HP","Max Speed":"18km/h","Incline":"0-15%"}'::jsonb,
  FALSE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'treadmill-pro-5-0');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'snooker-tables'),
  '7ft Snooker Table',
  '7ft-snooker-table',
  'Premium 7ft snooker table with slate bed.',
  'Tournament-style 7ft snooker table with slate bed, green cloth, solid wood frame and full accessory kit.',
  NULL,
  NULL,
  TRUE,
  2,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Snooker+Table'],
  '{"Size":"7ft","Bed":"Slate","Cloth":"Green"}'::jsonb,
  TRUE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = '7ft-snooker-table');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'snooker-tables'),
  '8ft Snooker Table',
  '8ft-snooker-table',
  'Full-size 8ft snooker table for clubs and hotels.',
  'Professional 8ft snooker table suitable for clubs, hotels and game rooms. Includes cues, balls and triangle.',
  NULL,
  NULL,
  TRUE,
  1,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=8ft+Snooker+Table'],
  '{"Size":"8ft","Bed":"Slate","Cloth":"Green"}'::jsonb,
  FALSE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = '8ft-snooker-table');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'table-tennis-tables'),
  'Indoor Table Tennis Table',
  'indoor-table-tennis-table',
  'Foldable indoor table tennis table with wheels.',
  'Competition-grade indoor table tennis table with 18mm top, foldable halves and lockable wheels.',
  210000,
  230000,
  FALSE,
  4,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Table+Tennis'],
  '{"Top":"18mm","Foldable":"Yes","Wheels":"Yes"}'::jsonb,
  TRUE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'indoor-table-tennis-table');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'sports-equipment'),
  'Football Training Set',
  'football-training-set',
  'Cones, bibs, agility ladder and ball bundle.',
  'Complete football training kit with cones, bibs, agility ladder and size 5 match ball.',
  45000,
  50000,
  FALSE,
  15,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Football+Set'],
  '{"Ball":"Size 5","Cones":"20","Bibs":"10"}'::jsonb,
  FALSE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'football-training-set');

INSERT INTO products (category_id, name, slug, short_description, description, price, compare_at_price, price_on_request, stock_quantity, track_stock, images, specs, is_featured, is_active)
SELECT
  (SELECT id FROM categories WHERE slug = 'recreational-equipment-more'),
  'Arcade Basketball Game',
  'arcade-basketball-game',
  'Electronic arcade basketball game for game rooms.',
  'Plug-and-play electronic basketball arcade game with scoreboard, foldable design and durable frame.',
  285000,
  310000,
  FALSE,
  2,
  TRUE,
  ARRAY['https://placehold.co/600x400/1a1a1a/ff5a1f?text=Arcade+Basketball'],
  '{"Players":"1-2","Power":"220V","Foldable":"Yes"}'::jsonb,
  TRUE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'arcade-basketball-game');

-- Sample variants for the 7ft snooker table
INSERT INTO product_variants (product_id, label, price, stock_quantity, is_active)
SELECT
  (SELECT id FROM products WHERE slug = '7ft-snooker-table'),
  'Blue cloth',
  NULL,
  1,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE label = 'Blue cloth' AND product_id = (SELECT id FROM products WHERE slug = '7ft-snooker-table'));

INSERT INTO product_variants (product_id, label, price, stock_quantity, is_active)
SELECT
  (SELECT id FROM products WHERE slug = '7ft-snooker-table'),
  'Red cloth',
  NULL,
  1,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE label = 'Red cloth' AND product_id = (SELECT id FROM products WHERE slug = '7ft-snooker-table'));

-- Update site settings with vendor details
UPDATE site_settings SET
  store_name = 'Bioliz Global Sport',
  whatsapp_number = '2348143309703',
  contact_email = 'info@biolizglobalsport.com',
  address = 'Lagos, Nigeria',
  hero_title = 'BUILD YOUR SPACE. TRAIN HARDER. PLAY BETTER.',
  hero_subtitle = 'Premium gym and sports equipment for homes, gyms, hotels, offices and clubs across Nigeria.'
WHERE id = 1;
