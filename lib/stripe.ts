// ─── Shared Stripe client ──────────────────────────────────────────────────
//
// Used by the Stripe webhook handler for signature verification and typed
// subscription/customer lookups. Other server-side routes (verify-payment,
// verify-workflow-subscription, verify-cd-subscription, lib/entitlements.ts)
// continue to use direct fetch against api.stripe.com for now; they can
// migrate to this client in a future cleanup pass without API-behavior change.
//
// apiVersion is intentionally omitted so the SDK's pinned default applies.
// This keeps the TypeScript types in sync with the response shapes the SDK
// was compiled against, regardless of the account's dashboard API version.

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("[lib/stripe] STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(secretKey ?? "");
