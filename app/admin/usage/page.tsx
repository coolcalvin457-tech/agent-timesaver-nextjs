// ─── /admin/usage ────────────────────────────────────────────────────────────
//
// Internal ops dashboard: one row per (user, tool) with current-subscription-
// period annual-subscription run count, cap, % of cap, status, most-recent
// run, and the user's subscription-period end (renewal date). Gated to
// Calvin's email via paa_session cookie. Non-Calvin sessions are redirected
// to /.
//
// Dark theme matches the Agents gradient (#14151A → #0A0A0C). Status column
// color-coded per cap-enforcement-copy.md §4. One-time runs are intentionally
// excluded from the count; caps apply to annual subscribers only. Users
// without cached Stripe period bounds (pre-webhook or actively cancelled)
// are excluded upstream by getAdminUsageRows.

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAdminUsageRows, type AdminUsageRow, type PaidToolName } from "@/lib/db";

export const dynamic = "force-dynamic";

// Both Calvin's Workspace email and his personal Gmail used for site login.
const ADMIN_EMAILS = new Set([
  "calvin@promptaiagents.com",
  "coolcalvin457@gmail.com",
]);

// Caps per Calvin's Brain/cap-setting-framework.md (mid-S192 revision).
// Competitor and Search caps are TBD at launch; display "—" until set.
const CAPS: Record<PaidToolName, number | null> = {
  workflow: 100,
  company: 150,
  swot: 40,
  competitor: null,
  search: null,
};

// Title-cased display names for the Tool column (no "AGENT:" prefix in tables).
const TOOL_LABEL: Record<PaidToolName, string> = {
  workflow: "Workflow",
  company: "Company",
  swot: "SWOT",
  competitor: "Competitor",
  search: "Search",
};

// Status buckets per cap-enforcement-copy.md §4.
// Colors: Under/Active neutral, Approaching cap amber, At cap red.
type StatusBucket = "Under" | "Active" | "Approaching cap" | "At cap";

function computeStatus(count: number, cap: number | null): { label: StatusBucket | "—"; color: string } {
  if (cap === null) {
    return { label: "—", color: "rgba(255,255,255,0.55)" };
  }
  const pct = (count / cap) * 100;
  if (pct >= 100) return { label: "At cap", color: "#D85C4A" };
  if (pct >= 75) return { label: "Approaching cap", color: "#E8A23D" };
  if (pct >= 50) return { label: "Active", color: "rgba(255,255,255,0.55)" };
  return { label: "Under", color: "rgba(255,255,255,0.55)" };
}

function formatPercent(count: number, cap: number | null): string {
  if (cap === null) return "—";
  return `${Math.round((count / cap) * 100)}%`;
}

// "Apr 14, 2026" per §4 example. Short month used in Last run column.
function formatShortDate(d: Date): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminUsagePage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
    redirect("/");
  }

  let rows: AdminUsageRow[] = [];
  let queryError = false;
  try {
    rows = await getAdminUsageRows();
  } catch (err) {
    console.error("[/admin/usage] query failed:", err);
    queryError = true;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #14151A 0%, #0A0A0C 100%)",
        color: "rgba(255,255,255,0.92)",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "48px 32px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 8,
            }}
          >
            Admin
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 8,
            }}
          >
            Usage
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
            }}
          >
            Annual-subscription runs for each user's current subscription period (aligned to Stripe renewal anniversary). One-time runs excluded.
          </p>
        </header>

        {queryError ? (
          <div
            style={{
              padding: 24,
              background: "rgba(216,92,74,0.08)",
              border: "1px solid rgba(216,92,74,0.24)",
              borderRadius: 12,
              color: "#D85C4A",
              fontSize: 14,
            }}
          >
            Query failed. Check server logs.
          </div>
        ) : rows.length === 0 ? (
          <div
            style={{
              padding: 24,
              background: "#181A1F",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.55)",
              fontSize: 14,
            }}
          >
            No annual-subscription runs recorded in any active subscription period.
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(180deg, #181A1F 0%, #141416 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Tool</th>
                  <th style={thStyleRight}>Runs this period</th>
                  <th style={thStyleRight}>Cap</th>
                  <th style={thStyleRight}>% of cap</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Last run</th>
                  <th style={thStyle}>Period ends</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const cap = CAPS[row.tool_name];
                  const status = computeStatus(row.count, cap);
                  return (
                    <tr
                      key={`${row.user_id}-${row.tool_name}`}
                      style={{
                        borderTop:
                          i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <td style={tdStyle}>{row.email}</td>
                      <td style={tdStyle}>{TOOL_LABEL[row.tool_name]}</td>
                      <td style={tdStyleRight}>{row.count}</td>
                      <td style={tdStyleRight}>{cap ?? "—"}</td>
                      <td style={tdStyleRight}>
                        {formatPercent(row.count, cap)}
                      </td>
                      <td style={{ ...tdStyle, color: status.color }}>
                        {status.label}
                      </td>
                      <td style={tdStyle}>{formatShortDate(row.last_run)}</td>
                      <td style={tdStyle}>{formatShortDate(row.period_end)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 20px",
  fontWeight: 500,
};

const thStyleRight: React.CSSProperties = {
  ...thStyle,
  textAlign: "right",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 20px",
  color: "rgba(255,255,255,0.88)",
};

const tdStyleRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
};
