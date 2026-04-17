// ─── Server-side entitlement checks for paid tools ──────────────────────────
//
// Two checks, both server-side, no client trust:
//   1. hasActiveAnnualSubscription(email, tool)
//        → Stripe customer lookup by email, then subscription lookup.
//          Returns true iff an active subscription matches the tool's
//          STRIPE_*_ANNUAL_PRICE_ID.
//   2. verifyOneTimeSession(sessionId, tool)
//        → Stripe Checkout Session lookup with expanded line_items.
//          Returns true iff payment_status === "paid" AND a line-item's
//          price matches the tool's STRIPE_*_ONETIME_PRICE_ID.
//
// These mirror the logic in /api/verify-workflow-subscription and
// /api/verify-payment but are callable from server code (paid-tool API
// routes) without an internal HTTP hop. The existing verify routes stay in
// place. They can migrate to call these helpers in a future cleanup pass.
//
// NOTE: verifyOneTimeSession does NOT enforce one-shot consumption. A buyer
// could reuse the same session_id URL to run the tool more than once. That
// gap is flagged in cap-enforcement-spec.md §Open issues and will be fixed
// in a separate session before paid-ad traffic.

import type { PaidToolName } from "@/lib/db";

interface ToolPriceEnv {
  annualEnv: string;
  onetimeEnv: string;
}

const TOOL_PRICE_ENV: Record<PaidToolName, ToolPriceEnv> = {
  workflow: {
    annualEnv: "STRIPE_WORKFLOW_ANNUAL_PRICE_ID",
    onetimeEnv: "STRIPE_WORKFLOW_ONETIME_PRICE_ID",
  },
  company: {
    annualEnv: "STRIPE_COMPANY_ANNUAL_PRICE_ID",
    onetimeEnv: "STRIPE_COMPANY_ONETIME_PRICE_ID",
  },
  swot: {
    annualEnv: "STRIPE_SWOT_ANNUAL_PRICE_ID",
    onetimeEnv: "STRIPE_SWOT_ONETIME_PRICE_ID",
  },
  competitor: {
    annualEnv: "STRIPE_COMPETITOR_ANNUAL_PRICE_ID",
    onetimeEnv: "STRIPE_COMPETITOR_ONETIME_PRICE_ID",
  },
  search: {
    annualEnv: "STRIPE_SEARCH_ANNUAL_PRICE_ID",
    onetimeEnv: "STRIPE_SEARCH_ONETIME_PRICE_ID",
  },
};

/**
 * Check whether the given email has an active annual subscription to the
 * given paid tool. Server-side Stripe lookup. Returns false on any failure
 * (missing env, HTTP error, no matching price).
 */
export async function hasActiveAnnualSubscription(
  email: string,
  tool: PaidToolName
): Promise<boolean> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[hasActiveAnnualSubscription] STRIPE_SECRET_KEY not set");
    return false;
  }

  const priceId = process.env[TOOL_PRICE_ENV[tool].annualEnv];
  if (!priceId) {
    // Tool not yet launched (SWOT/Competitor/Search pre-launch) or env var
    // missing. Either way, no annual entitlement can match.
    return false;
  }

  const normalizedEmail = email.trim();
  if (!normalizedEmail) return false;

  try {
    const customersRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(normalizedEmail)}&limit=5`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (!customersRes.ok) {
      console.error(
        "[hasActiveAnnualSubscription] Stripe customer lookup failed:",
        await customersRes.text()
      );
      return false;
    }

    const customers = (await customersRes.json()) as {
      data: Array<{ id: string }>;
    };
    if (!customers.data || customers.data.length === 0) return false;

    for (const customer of customers.data) {
      const subsRes = await fetch(
        `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=10`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );
      if (!subsRes.ok) continue;

      const subs = (await subsRes.json()) as {
        data: Array<{
          items: { data: Array<{ price: { id: string } }> };
        }>;
      };

      for (const sub of subs.data ?? []) {
        for (const item of sub.items?.data ?? []) {
          if (item.price?.id === priceId) return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error("[hasActiveAnnualSubscription] lookup error:", err);
    return false;
  }
}

/**
 * Verify that a Stripe Checkout Session is paid AND its line item matches
 * the expected one-time price for the given tool. Returns false on any
 * failure (missing env, HTTP error, not-paid session, mismatched price).
 */
export async function verifyOneTimeSession(
  sessionId: string,
  tool: PaidToolName
): Promise<boolean> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[verifyOneTimeSession] STRIPE_SECRET_KEY not set");
    return false;
  }

  const expectedPriceId = process.env[TOOL_PRICE_ENV[tool].onetimeEnv];
  if (!expectedPriceId) {
    // Pre-launch tool or env var missing; fail closed.
    return false;
  }

  const cleanId = sessionId.trim();
  if (!cleanId) return false;

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cleanId)}?expand[]=line_items`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (!res.ok) {
      console.error(
        "[verifyOneTimeSession] Stripe session lookup failed:",
        await res.text()
      );
      return false;
    }

    const session = (await res.json()) as {
      payment_status?: string;
      line_items?: {
        data?: Array<{ price?: { id?: string } }>;
      };
    };

    if (session.payment_status !== "paid") return false;

    const items = session.line_items?.data ?? [];
    for (const item of items) {
      if (item.price?.id === expectedPriceId) return true;
    }
    return false;
  } catch (err) {
    console.error("[verifyOneTimeSession] lookup error:", err);
    return false;
  }
}
