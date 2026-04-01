-- Migration 002: Create tool_usage_log table
-- Run against Vercel Postgres (Neon) via the Vercel dashboard SQL editor
-- or via psql connected to STORAGE_URL
--
-- Purpose: Track every confirmed tool run (logged at email delivery).
-- Used for: per-email usage caps, IP-based abuse detection, ToS enforcement.
-- Logging happens fire-and-forget in each *-email route — never blocks a response.

CREATE TABLE IF NOT EXISTS tool_usage_log (
  id         SERIAL PRIMARY KEY,
  email      TEXT,                                          -- nullable: gate email, lowercased
  tool_name  TEXT        NOT NULL,                         -- e.g. 'timesaver', 'industry-intel'
  ip_address TEXT,                                         -- x-forwarded-for, first hop
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL, -- null for non-logged-in users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query patterns this supports:
--   COUNT per email per tool per 30-day window  → per-email caps
--   COUNT per IP per tool per hour              → IP-based abuse detection
--   COUNT per tool per day                      → usage analytics

CREATE INDEX IF NOT EXISTS idx_tool_usage_log_email      ON tool_usage_log (email);
CREATE INDEX IF NOT EXISTS idx_tool_usage_log_tool_name  ON tool_usage_log (tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_log_ip         ON tool_usage_log (ip_address);
CREATE INDEX IF NOT EXISTS idx_tool_usage_log_created_at ON tool_usage_log (created_at);
