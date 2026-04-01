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

// ─── Tool usage logging ──────────────────────────────────────────────────────

/**
 * Log a confirmed tool run. Call fire-and-forget — never throws.
 * Logging happens at email delivery (the point where email + IP are both known).
 *
 * @param email      - Gate email submitted by user. Null if unavailable.
 * @param toolName   - Slug identifier: 'timesaver' | 'prompt-builder' | 'budget-spreadsheets'
 *                     | 'onboarding-kit' | 'pip-builder' | 'workflow-builder' | 'industry-intel'
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
