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
const pool = createPool({
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
// getAnnualToolRunCount.
//
// Window: UTC calendar year. Resets 00:00 UTC January 1.
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

/**
 * Idempotent alert-slot claim. Returns true if this alert has NOT yet been
 * sent for this (user, tool, year, type); atomic INSERT ... ON CONFLICT
 * prevents double-send across concurrent requests.
 *
 * period_bucket is the UTC calendar year as a 4-char string, e.g. '2026'.
 */
export async function claimAlertSlot(
  userId: string,
  toolName: PaidToolName,
  alertType: "user_75" | "calvin_80"
): Promise<boolean> {
  const periodBucket = new Date().toISOString().slice(0, 4); // 'YYYY'
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
 * One row per (user, tool) with their current-calendar-year annual-subscription
 * run count and most-recent run timestamp. Powers /admin/usage and the GET
 * /api/admin/usage endpoint. One-time runs are intentionally excluded; caps
 * apply to annual subscribers only.
 *
 * Ordered by count DESC so the highest-usage rows surface at the top.
 */
export interface AdminUsageRow {
  user_id: string;
  email: string;
  tool_name: PaidToolName;
  count: number;
  last_run: Date;
}

export async function getAdminUsageRows(): Promise<AdminUsageRow[]> {
  const result = await pool.sql<AdminUsageRow>`
    SELECT user_id,
           email,
           tool_name,
           COUNT(*)::int AS count,
           MAX(created_at) AS last_run
    FROM paid_tool_runs
    WHERE created_at >= date_trunc('year', now() AT TIME ZONE 'UTC')
      AND subscription_type = 'annual'
    GROUP BY user_id, email, tool_name
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
