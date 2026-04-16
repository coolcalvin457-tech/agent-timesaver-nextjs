-- Migration 006: Backfill paid_tool_runs from competitive_dossier_runs
-- Run AFTER migration 005 in Neon SQL editor.
--
-- Purpose: Preserve historical Company run counts so cap enforcement
-- continues uninterrupted when the Company route switches to the
-- generalized paid_tool_runs table.
--
-- Strategy: copy all existing Company runs with tool_name='company' and
-- subscription_type='annual'. Pre-S188 Company pricing was annual-only,
-- so every historical row maps to subscription_type='annual'. Post-S188
-- one-time Company purchases are not in competitive_dossier_runs (the
-- code path only wrote to it for annual subscribers), so nothing is lost.
--
-- competitive_dossier_runs itself stays in place as a historical audit
-- record. No DROP. After this migration, the Company route writes only
-- to paid_tool_runs (see S191 Step 4 in cap-enforcement-spec.md).

INSERT INTO paid_tool_runs (id, user_id, email, tool_name, subscription_type, target_ref, created_at)
SELECT
  id,
  user_id,
  email,
  'company'  AS tool_name,
  'annual'   AS subscription_type,
  target_url AS target_ref,
  created_at
FROM competitive_dossier_runs
ON CONFLICT (id) DO NOTHING;

-- Verification query to run after the backfill:
--
--   SELECT
--     (SELECT COUNT(*) FROM competitive_dossier_runs) AS source_rows,
--     (SELECT COUNT(*) FROM paid_tool_runs WHERE tool_name = 'company') AS backfilled_rows;
--
-- Both counts should match. If they don't, investigate before proceeding.
