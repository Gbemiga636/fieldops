-- FieldOps Database Schema
-- Run this in your Supabase SQL Editor

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  password_set BOOLEAN DEFAULT FALSE,
  remind_later BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location shares from field agents
CREATE TABLE IF NOT EXISTS location_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  address TEXT,
  device TEXT,
  browser TEXT,
  status TEXT DEFAULT 'active',
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_location_shares_agent_name ON location_shares(agent_name);
CREATE INDEX IF NOT EXISTS idx_location_shares_shared_at ON location_shares(shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_shares_status ON location_shares(status);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_shares ENABLE ROW LEVEL SECURITY;

-- Policies: service role bypasses RLS; anon can insert locations and read for API
CREATE POLICY "Allow anon insert locations" ON location_shares
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon read locations" ON location_shares
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon delete locations" ON location_shares
  FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read admin" ON admin_users
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon update admin" ON admin_users
  FOR UPDATE TO anon USING (true);

-- Seed default admin user (password will be set on first login)
INSERT INTO admin_users (username, password_set, remind_later)
VALUES ('oluwaseyi', FALSE, FALSE)
ON CONFLICT (username) DO NOTHING;

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE location_shares;
