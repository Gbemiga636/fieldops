-- Run this in Supabase SQL Editor for exact location fields
ALTER TABLE location_shares ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE location_shares ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE location_shares ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE location_shares ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE location_shares ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE location_shares ADD COLUMN IF NOT EXISTS postcode TEXT;

CREATE INDEX IF NOT EXISTS idx_location_shares_city ON location_shares(city);
CREATE INDEX IF NOT EXISTS idx_location_shares_state ON location_shares(state);
CREATE INDEX IF NOT EXISTS idx_location_shares_area ON location_shares(area);
