-- Migration 007: Create paid_tool_alerts table
-- Run AFTER migration 006 in Neon SQL editor.
--
-- Purpose: Idempotency ledger for the 75% "on pace" user email and the
-- 80% internal alert email to Calvin. One row per (user, tool, month,
-- alert_type). The UNIQUE constraint prevents double-send across
-- concurrent generate requests.
--
-- Consumed by claimAlertSlot() in lib/db.ts. See cap-enforcement-spec.md
-- Step 2 for the helper signature and cap-enforcement-copy.md for the
-- email copy it gates.

CREATE TABLE IF NOT EXISTS paid_tool_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_name    TEXT NOT NULL,
  month_bucket TEXT NOT NULL,           -- 'YYYY-MM' in UTC
  alert_type   TEXT NOT NULL,           -- 'user_75' | 'calvin_80'
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_name, month_bucket, alert_type)
);

-- Fast lookup for "has this user been alerted this month"
CREATE INDEX IF NOT EXISTS idx_pta_user_month
  ON paid_tool_alerts (user_id, month_bucket);
