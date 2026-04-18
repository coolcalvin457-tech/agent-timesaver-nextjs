-- Migration 008: Add subscription-period tracking to users (S194)
-- Run AFTER migration 007 in Neon SQL editor:
-- https://console.neon.tech -> promptaiagents-db -> SQL Editor
--
-- Purpose: Cache the user's current Stripe annual-subscription period on the
-- users table so cap checks don't require a Stripe API call on every generate.
-- Populated and refreshed via the invoice.payment_succeeded webhook.
--
-- For one-time buyers, these columns stay NULL. One-time buyers are not
-- cap-checked; their entitlement is the deliverable itself.
--
-- This migration replaces the S192 calendar-year cap window with a
-- subscription-year window aligned to each user's Stripe renewal anniversary.
-- Rationale in cap-setting-framework.md "Window choice (subscription-year, locked)".
-- Consumed by getCurrentSubscriptionPeriod() and getCurrentPeriodRunCount()
-- in lib/db.ts. See cap-enforcement-spec.md S194 deploy order for the full
-- rollout sequence.
--
-- Idempotent. Safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_current_period_start  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id       TEXT;

-- Fast cap-check lookups
CREATE INDEX IF NOT EXISTS idx_users_sub_period
  ON users (id, stripe_current_period_start, stripe_current_period_end);
