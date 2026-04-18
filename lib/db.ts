// ─── Database connection + query helpers ──────────────────────────────────────
//
// Uses @vercel/postgres for Vercel Postgres (Neon) connection.
// Connection string comes from STORAGE_URL env var (set in Vercel dashboard).
//
// Raw SQL only. No ORM. Two tables: users, magic_links.

import { createPool } from "@vercel/postgres";
import { createHash, randomBytes } from "crypto";

// ─── Pool ────────────────────────────────────────────────────────────────────

// createPool reads POSTGRES_URL by default. We override with STORAGE_URL.
// Exported so the Stripe webhook handler can run UPDATE statements against
// the same connection pool without re-instantiating.
export const pool = createPool({
  connectionString: process.env.STORAGE_URL,
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DBUser {
  id: string;
  email: string;
  first_name: string;
  job_title: string | null;
  stripe_customer_id: string | null;
  suspended: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DBMagicLink {
  id: string;
  email: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

// ─── Token hashing ──────────────────────────────────────────────────────────

/** Generate a cryptographically random token (32 bytes, hex). */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 hash a token for storage. Raw token goes in email, hash goes in DB. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── User queries ────────────────────────────────────────────────────────────

/** Find a user by email. Returns null if not found. */
export async function findUserByEmail(
  email: string
): Promise<DBUser | null> {
  const result = await pool.sql<DBUser>`
    SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

/** Find a user by ID. Returns null if not found. */
export async function findUserById(id: string): Promise<DBUser | null> {
  const result = await pool.sql<DBUser>`
    SELECT * FROM users WHERE id = ${id}::uuid LIMIT 1
  `;
  return result.rows[0] ?? null;
}

/** Create a new user. Returns the created user. */
export async function createUser(
  email: string,
  firstName: string,
  jobTitle?: string
): Promise<DBUser> {
  const result = await pool.sql<DBUser>`
    INSERT INTO users (email, first_name, job_title)
    VALUES (${email.toLowerCase()}, ${firstName}, ${jobTitle ?? null})
    RETURNING *
  `;
  return result.rows[0];
}

// ─── Magic link queries ──────────────────────────────────────────────────────

/** Create a magic link record. Token hash is stored, raw token is NOT. */
export async function createMagicLink(
  email: string,
  tokenHash: string,
  expiresAt: Date
): Promise<DBMagicLink> {
  const result = await pool.sql<DBMagicLink>`
    INSERT INTO magic_links (email, token_hash, expires_at)
    VALUES (${email.toLowerCase()}, ${tokenHash}, ${expiresAt.toISOString()})
    RETURNING *
  `;
  return result.rows[0];
}

/** Find a magic link by token hash. Returns null if not found. */
export async function findMagicLinkByTokenHash(
  tokenHash: string
): Promise<DBMagicLink | null> {
  const result = await pool.sql<DBMagicLink>`
    SELECT * FROM magic_links WHERE token_hash = ${tokenHash} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

/** Mark a magic link as used. Prevents replay. */
export async function markMagicLinkUsed(id: string): Promise<void> {
  await pool.sql`
    UPDATE magic_links SET used = TRUE WHERE id = ${id}::uuid
  `;
}

// ─── AGENT: Company run tracking (legacy) ──────────────────────────────

/**
 * @deprecated Use getAnnualToolRunCount(userId, "company") instead.
 * Legacy helper. Still here so the Company route compiles during the
 * incremental cap-enforcement rollout. Will be removed after Step 4
 * swaps the Company route over to the generalized helpers.
 */
export async function getMonthlyDossierRunCount(userId: string): Promise<number> {
  const result = await pool.sql<{ count: string }>`
    SELECT COUNT(*) AS count
    FROM competitive_dossier_runs
    WHERE user_id = ${userId}::uuid
      AND created_at >= date_trunc('month', now() AT TIME ZONE 'UTC')
  `;
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/**
 * @deprecated Use logPaidToolRun(userId, email, "company", "annual", companyUrl).
 * Legacy helper retained for the same reason as above. Removed after Step 4.
 */
export async function logDossierRun(
  userId: string,
  email: string,
  targetUrl: string,
  companyName?: string | null
): Promise<void> {
  try {
    await pool.sql`
      INSERT INTO competitive_dossier_runs (user_id, email, target_url, company_name)
      VALUES (
        ${userId}::uuid,
        ${email.toLowerCase()},
        ${targetUrl},
        ${companyName ?? null}
      )
    `;
  } catch (err) {
    console.error("[logDossierRun] Failed to log dossier run:", err);
  }
}

// ─── Paid-tool run tracking (generalized) ──────────────────────────────
//
// One schema for all paid tools. Company backfill from
// competitive_dossier_runs landed via migration 006. New runs for any paid
// tool should be logged via logPaidToolRun and cap-checked via
// getCurrentPeriodRunCount (see below).
//
// Window (S194): subscription period aligned to the user's Stripe annual
// renewal anniversary. Bounds are cached on the users table (populated by
// the invoice.payment_succeeded webhook) and read via
// getCurrentSubscriptionPeriod. Previous window was UTC calendar year
// (S192/S193, getAnnualToolRunCount, now @deprecated).
// Scope: annual subscribers only. One-time runs are logged for analytics
// but excluded from the cap count.

export type PaidToolName =
  | "workflow"
  | "company"
  | "swot"
  | "competitor"
  | "search";
export type SubscriptionType = "annual" | "onetime";

/**
 * User's current Stripe annual-subscription period. Reads the cached bounds
 * populated by the invoice.payment_succeeded webhook. Returns null if the
 * user has no active annual subscription (no row, one-time-only buyer,
 * cancelled subscriber). Route code treats null as "no active cap window"
 * and denies.
 */
export interface SubscriptionPeriod {
  start: Date;
  end: Date;
  subscriptionId: string;
}

export async function getCurrentSubscriptionPeriod(
  userId: string
): Promise<SubscriptionPeriod | null> {
  const result = await pool.sql<{
    stripe_current_period_start: Date | null;
    stripe_current_period_end: Date | null;
    stripe_subscription_id: string | null;
  }>`
    SELECT stripe_current_period_start,
           stripe_current_period_end,
           stripe_subscription_id
    FROM users
    WHERE id = ${userId}::uuid
    LIMIT 1
  `;
  const row = result.rows[0];
  if (
    !row ||
    !row.stripe_current_period_start ||
    !row.stripe_current_period_end ||
    !row.stripe_subscription_id
  ) {
    return null;
  }
  return {
    start: row.stripe_current_period_start,
    end: row.stripe_current_period_end,
    subscriptionId: row.stripe_subscription_id,
  };
}

/**
 * Annual run count for a user for a specific paid tool within their current
 * Stripe subscription period. Counts annual-subscription runs only; one-time
 * runs are logged for analytics but intentionally excluded from the cap check.
 *
 * Caller passes the period start from getCurrentSubscriptionPeriod(). No
 * upper bound on the query — a late-arriving webhook that rolls the period
 * forward shouldn't retroactively strip runs out of the count mid-request.
 * Runs created after the new period_start will just count against the new
 * window; runs in the old window fall off naturally on the next call.
 */
export async function getCurrentPeriodRunCount(
  userId: string,
  toolName: PaidToolName,
  periodStart: Date
): Promise<number> {
  const result = await pool.sql<{ count: string }>`
    SELECT COUNT(*) AS count
    FROM paid_tool_runs
    WHERE user_id = ${userId}::uuid
      AND tool_name = ${toolName}
      AND subscription_type = 'annual'
      AND created_at >= ${periodStart.toISOString()}
  `;
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/**
 * @deprecated S194: use getCurrentPeriodRunCount(userId, toolName, periodStart)
 * against the user's Stripe subscription-period window instead. This
 * calendar-year variant is kept only so routes that haven't been swapped
 * yet still compile; remove once no callers remain.
 *
 * Annual run count for a user for a specific paid tool (current UTC
 * calendar year). Counts annual-subscription runs only; one-time runs are
 * logged for analytics but intentionally excluded from the cap check.
 */
export async function getAnnualToolRunCount(
  userId: string,
  toolName: PaidToolName
): Promise<number> {
  const result = await pool.sql<{ count: string }>`
    SELECT COUNT(*) AS count
    FROM paid_tool_runs
    WHERE user_id = ${userId}::uuid
      AND tool_name = ${toolName}
      AND subscription_type = 'annual'
      AND created_at >= date_trunc('year', now() AT TIME ZONE 'UTC')
  `;
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/**
 * Log a completed paid-tool run. Fire-and-forget safe; never throws.
 * Call after successful generation (before email delivery).
 */
export async function logPaidToolRun(
  userId: string,
  email: string,
  toolName: PaidToolName,
  subscriptionType: SubscriptionType,
  targetRef?: string | null
): Promise<void> {
  try {
    await pool.sql`
      INSERT INTO paid_tool_runs (user_id, email, tool_name, subscription_type, target_ref)
      VALUES (
        ${userId}::uuid,
        ${email.toLowerCase()},
        ${toolName},
        ${subscriptionType},
        ${targetRef ?? null}
      )
    `;
  } catch (err) {
    console.error("[logPaidToolRun] Failed to log run:", err);
  }
}

export type AlertType = "user_75" | "calvin_80" | "pace_exceeded_75";

/**
 * Idempotent alert-slot claim. Returns true if this alert has NOT yet been
 * sent for this (user, tool, period, type); atomic INSERT ... ON CONFLICT
 * prevents double-send across concurrent requests.
 *
 * period_bucket (S194): '[user_id]:[period_start_YYYY-MM-DD]' when periodStart
 * is provided, aligned to the user's Stripe renewal anniversary. Includes
 * user_id so two users with the same renewal date can't collide.
 *
 * Legacy fallback: if periodStart is omitted, uses the UTC calendar year
 * bucket ('YYYY'). Present only so alerts.ts + routes continue to compile
 * during the S194 migration; remove after all callers pass periodStart.
 */
export async function claimAlertSlot(
  userId: string,
  toolName: PaidToolName,
  alertType: AlertType,
  periodStart?: Date
): Promise<boolean> {
  const periodBucket = periodStart
    ? `${userId}:${periodStart.toISOString().slice(0, 10)}`
    : new Date().toISOString().slice(0, 4); // legacy 'YYYY' fallback
  try {
    const result = await pool.sql`
      INSERT INTO paid_tool_alerts (user_id, tool_name, period_bucket, alert_type)
      VALUES (${userId}::uuid, ${toolName}, ${periodBucket}, ${alertType})
      ON CONFLICT (user_id, tool_name, period_bucket, alert_type) DO NOTHING
      RETURNING id
    `;
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("[claimAlertSlot] Failed to claim alert:", err);
    return false;
  }
}

// ─── Admin dashboard query ──────────────────────────────────────────────────

/**
 * One row per (user, tool) with their current-subscription-period annual-
 * subscription run count, most-recent run timestamp, and the user's Stripe
 * current-period bounds (period_start / period_end). Powers /admin/usage and
 * the GET /api/admin/usage endpoint.
 *
 * One-time runs are intentionally excluded; caps apply to annual subscribers.
 * Users whose Stripe period bounds aren't populated on the users row
 * (pre-webhook or actively cancelled) are excluded — the dashboard mirrors
 * what the cap check sees, and a null-period row with no period_end can't be
 * rendered meaningfully.
 *
 * Ordered by count DESC so the highest-usage rows surface at the top.
 */
export interface AdminUsageRow {
  user_id: string;
  email: string;
  tool_name: PaidToolName;
  count: number;
  last_run: Date;
  period_start: Date;
  period_end: Date;
}

export async function getAdminUsageRows(): Promise<AdminUsageRow[]> {
  const result = await pool.sql<AdminUsageRow>`
    SELECT ptr.user_id,
           ptr.email,
           ptr.tool_name,
           COUNT(*)::int                    AS count,
           MAX(ptr.created_at)              AS last_run,
           u.stripe_current_period_start    AS period_start,
           u.stripe_current_period_end      AS period_end
    FROM paid_tool_runs ptr
    JOIN users u ON u.id = ptr.user_id
    WHERE ptr.subscription_type = 'annual'
      AND u.stripe_current_period_start IS NOT NULL
      AND u.stripe_current_period_end   IS NOT NULL
      AND ptr.created_at >= u.stripe_current_period_start
      AND ptr.created_at <  u.stripe_current_period_end
    GROUP BY ptr.user_id,
             ptr.email,
             ptr.tool_name,
             u.stripe_current_period_start,
             u.stripe_current_period_end
    ORDER BY count DESC
  `;
  return result.rows;
}

// ─── Tool usage logging ──────────────────────────────────────────────────────

/**
 * Log a confirmed tool run. Call fire-and-forget — never throws.
 * Logging happens at email delivery (the point where email + IP are both known).
 *
 * @param email      - Gate email submitted by user. Null if unavailable.
 * @param toolName   - Slug identifier: 'timesaver' | 'prompts' | 'spreadsheets'
 *                     | 'onboarding' | 'pip' | 'workflow' | 'industry' | 'company'
 * @param ipAddress  - First hop from x-forwarded-for header. Null if unavailable.
 * @param userId     - UUID from users table if the user is logged in. Null otherwise.
 */
export async function logToolUsage(
  email: string | null,
  toolName: string,
  ipAddress: string | null,
  userId?: string | null
): Promise<void> {
  try {
    await pool.sql`
      INSERT INTO tool_usage_log (email, tool_name, ip_address, user_id)
      VALUES (
        ${email ? email.toLowerCase() : null},
        ${toolName},
        ${ipAddress ?? null},
        ${userId ?? null}
      )
    `;
  } catch (err) {
    console.error("[logToolUsage] Failed to log tool usage:", err);
  }
}
