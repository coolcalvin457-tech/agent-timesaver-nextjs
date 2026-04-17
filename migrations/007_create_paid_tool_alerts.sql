-- Migration 007: Create paid_tool_alerts table
-- Run AFTER migration 006 in Neon SQL editor.
--
-- Purpose: Idempotency ledger for the 75% "on pace" user email and the
-- 80% internal alert email to Calvin. One row per (user, tool, period,
-- alert_type). The UNIQUE constraint prevents double-send across
-- concurrent generate requests.
--
-- period_bucket is the UTC calendar year, e.g. '2026'. The column is
-- named generically (not `year_bucket`) so the same ledger can absorb
-- future alert cadences (e.g., sub-annual anomaly alerts) without a
-- schema change.
--
-- Consumed by claimAlertSlot() in lib/db.ts. See cap-enforcement-spec.md
-- Step 2 for the helper signature and cap-enforcement-copy.md for the
-- email copy it gates.

CREATE TABLE IF NOT EXISTS paid_tool_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_name     TEXT NOT NULL,
  period_bucket TEXT NOT NULL,           -- 'YYYY' in UTC (calendar-year cap window)
  alert_type    TEXT NOT NULL,           -- 'user_75' | 'calvin_80'
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_name, period_bucket, alert_type)
);

-- Fast lookup for "has this user been alerted this period"
CREATE INDEX IF NOT EXISTS idx_pta_user_period
  ON paid_tool_alerts (user_id, period_bucket);
