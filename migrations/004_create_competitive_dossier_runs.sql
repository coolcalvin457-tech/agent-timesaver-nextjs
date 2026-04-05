-- Migration 004: Create competitive_dossier_runs table
-- Tracks monthly run usage for the Competitive Dossier tool.
-- Used to enforce the 15-run/month limit per user.
--
-- Run in Neon SQL editor:
-- https://console.neon.tech → promptaiagents-db → SQL Editor

CREATE TABLE IF NOT EXISTS competitive_dossier_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  target_url  TEXT NOT NULL,
  company_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast monthly count lookups by user
CREATE INDEX IF NOT EXISTS idx_cd_runs_user_created
  ON competitive_dossier_runs (user_id, created_at);
