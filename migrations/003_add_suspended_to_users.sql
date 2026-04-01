-- Migration 003: Add suspended flag to users table
-- Run against Vercel Postgres (Neon) via the Vercel dashboard SQL editor
-- or via psql connected to STORAGE_URL
--
-- Purpose: Enable account-level access revocation without deleting users.
-- Usage:   UPDATE users SET suspended = true WHERE email = 'abuser@example.com';
-- Effect:  /api/auth/me returns 401 + clears cookie on next request.
--          Works for both free and paid tool access immediately.

ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_suspended ON users (suspended) WHERE suspended = true;
