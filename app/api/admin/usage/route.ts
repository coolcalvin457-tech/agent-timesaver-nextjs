// ─── GET /api/admin/usage ────────────────────────────────────────────────────
//
// Returns one row per (user, tool) with their current-subscription-period
// annual-subscription run count, most-recent run timestamp, and Stripe
// current-period bounds (period_start / period_end). Gated to Calvin.
// One-time runs are intentionally excluded; caps apply to annual subscribers.
//
// Powers the /admin/usage dashboard page and any ops scripts that need a JSON
// feed. See Calvin's Brain/cap-enforcement-spec.md §Step 6.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAdminUsageRows } from "@/lib/db";

// Both Calvin's Workspace email and his personal Gmail used for site login.
const ADMIN_EMAILS = new Set([
  "calvin@promptaiagents.com",
  "coolcalvin457@gmail.com",
]);

export async function GET() {
  const user = await getSessionUser();
  if (!user || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const rows = await getAdminUsageRows();
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[/api/admin/usage] query failed:", err);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
}
