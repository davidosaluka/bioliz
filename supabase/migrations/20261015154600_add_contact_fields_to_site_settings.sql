-- Add contact fields to site_settings
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Seed existing single row with sensible defaults if columns are empty
UPDATE site_settings
SET
  phone_number = COALESCE(NULLIF(phone_number, ''), '2348143309703'),
  business_hours = COALESCE(NULLIF(business_hours, ''), 'Monday – Saturday: 9:00 AM – 6:00 PM WAT'),
  social_links = COALESCE(NULLIF(social_links, '{}'), '{}')
WHERE id = 1;
