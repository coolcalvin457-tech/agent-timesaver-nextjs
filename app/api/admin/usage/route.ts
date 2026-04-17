// ─── GET /api/admin/usage ────────────────────────────────────────────────────
//
// Returns one row per (user, tool) with their current-calendar-year annual-
// subscription run count and most-recent run timestamp. Gated to Calvin.
// One-time runs are intentionally excluded; caps apply to annual subscribers.
//
// Powers the /admin/usage dashboard page and any ops scripts that need a JSON
// feed. See Calvin's Brain/cap-enforcement-spec.md §Step 6.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAdminUsageRows } from "@/lib/db";

const ADMIN_EMAIL = "calvin@promptaiagents.com";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
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
