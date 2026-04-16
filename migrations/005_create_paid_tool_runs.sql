-- Migration 005: Create paid_tool_runs table
-- Run against Vercel Postgres (Neon) via the Vercel dashboard SQL editor
-- or via psql connected to STORAGE_URL.
--
-- Neon SQL editor: https://console.neon.tech -> promptaiagents-db -> SQL Editor
--
-- Purpose: Enforce monthly caps for annual subscribers across all paid tools.
-- One row per successful run. Checked before generation, logged after.
--
-- Supersedes competitive_dossier_runs (kept read-only after migration 006
-- backfills its data into this table).

CREATE TABLE IF NOT EXISTS paid_tool_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  tool_name         TEXT NOT NULL,        -- 'workflow' | 'company' | 'swot' | 'competitor' | 'search'
  subscription_type TEXT NOT NULL,        -- 'annual' (caps apply) | 'onetime' (not capped; logged for analytics)
  target_ref        TEXT,                 -- tool-specific reference (company URL, workflow title, etc.)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast monthly count lookups per user per tool
CREATE INDEX IF NOT EXISTS idx_ptr_user_tool_created
  ON paid_tool_runs (user_id, tool_name, created_at);

-- Fast lookups for admin dashboard (tool-wide by month)
CREATE INDEX IF NOT EXISTS idx_ptr_tool_created
  ON paid_tool_runs (tool_name, created_at);

-- Query patterns this supports:
--   COUNT per user per tool per calendar month (UTC)   -> cap enforcement
--   SELECT per tool per month ordered by count         -> /admin/usage
--   COUNT per subscription_type per tool per month     -> annual vs. onetime analytics
