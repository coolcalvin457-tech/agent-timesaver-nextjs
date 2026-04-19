// ─── Stripe webhook handler ─────────────────────────────────────────────────
//
// Keeps the cached Stripe subscription period on `users` in sync with the
// source of truth (Stripe) and fires the §6 welcome email on first purchase.
// Three events are handled:
//
//   invoice.payment_succeeded
//     Fires on the initial annual checkout completion AND every subsequent
//     annual renewal. Used to populate / refresh:
//       users.stripe_subscription_id
//       users.stripe_current_period_start
//       users.stripe_current_period_end
//     On the FIRST invoice of a subscription (billing_reason
//     "subscription_create") the §6 welcome email also fires. Renewals
//     do NOT re-send. One-time payments also fire this event but have no
//     invoice.subscription, so they are ignored here and handled by
//     checkout.session.completed instead.
//
//   checkout.session.completed
//     Fires once per successful Stripe Checkout. Used for the one-time
//     branch of the §6 welcome email (Workflow $49, Company $29). The
//     subscription branch is handled by invoice.payment_succeeded above
//     so we don't double-send.
//
//   customer.subscription.deleted
//     Fires when a subscription is cancelled. Clears the three columns so
//     subsequent cap checks fail closed (no active period → getCurrentSub-
//     scriptionPeriod returns null → getCurrentPeriodRunCount returns 0 →
//     getCurrentSubscriptionPeriod on route side returns null → route denies).
//
// Signature verification is cryptographic (HMAC-SHA256) via
// stripe.webhooks.constructEvent against the raw request body. The raw body
// is required — any framework that parses JSON before this handler sees it
// will break signature checks. Next.js App Router gives us the raw body via
// req.text(), which is safe.
//
// Spec: cap-enforcement-spec.md "Stripe webhook handler (S194)",
//       cap-enforcement-copy.md §6 (welcome email, S195-Copy).

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import {
  sendWelcomeEmail,
  priceIdToWelcomeTool,
  type WelcomeTool,
} from "@/lib/emails/welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[stripe/webhook] Failed to read request body:", err);
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      }

      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      default:
        // All other events are ignored. Stripe expects a 2xx response so it
        // doesn't retry; returning 200 with received:true is the idiom.
        break;
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    console.error(`[stripe/webhook] Handler error for ${event.type}:`, err);
    // 500 so Stripe retries transient failures (DB blip, Stripe API 5xx).
    // Permanent bugs will surface in logs and can be fixed with a deploy.
    return NextResponse.json(
      { error: "handler_failed", type: event.type },
      { status: 500 }
    );
  }
}

// ─── invoice.payment_succeeded ──────────────────────────────────────────────

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Only care about subscription invoices. One-time payments fire this event
  // too (for their single-invoice cycle) but have no subscription reference.
  //
  // Stripe removed invoice.subscription from the top level in recent API
  // versions; the subscription reference now lives on invoice.parent.
  // subscription_details.subscription and/or invoice.lines.data[*].subscription.
  // Read all three paths; first non-null wins. Cast through unknown so the
  // code compiles against any SDK version without pinning.
  const invoiceAny = invoice as unknown as {
    subscription?: string | { id: string } | null;
    parent?: {
      subscription_details?: {
        subscription?: string | { id: string } | null;
      };
    };
    lines?: {
      data?: Array<{
        subscription?: string | { id: string } | null;
      }>;
    };
  };
  const rawSub =
    invoiceAny.subscription ??
    invoiceAny.parent?.subscription_details?.subscription ??
    invoiceAny.lines?.data?.[0]?.subscription;
  const subscriptionId =
    typeof rawSub === "string" ? rawSub : rawSub?.id;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Stripe moved top-level current_period_* to subscription.items[*] in the
  // 2025-01-27 API version. Read both paths; first non-null wins. Cast to any
  // for forward/backward compatibility across SDK versions without pinning.
  const subAny = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
    items?: {
      data?: Array<{
        current_period_start?: number;
        current_period_end?: number;
      }>;
    };
  };
  const firstItem = subAny.items?.data?.[0];
  const periodStart = subAny.current_period_start ?? firstItem?.current_period_start;
  const periodEnd = subAny.current_period_end ?? firstItem?.current_period_end;
  if (!periodStart || !periodEnd) {
    console.warn(
      `[stripe/webhook] invoice.payment_succeeded (${invoice.id}) for sub ${subscriptionId}: no period bounds found`
    );
    return;
  }

  // Prefer invoice.customer_email; fall back to retrieving the customer.
  let customerEmail = invoice.customer_email?.toLowerCase() ?? null;
  if (!customerEmail) {
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) {
        customerEmail = customer.email.toLowerCase();
      }
    }
  }
  if (!customerEmail) {
    console.warn(
      `[stripe/webhook] invoice.payment_succeeded (${invoice.id}): no customer email resolved`
    );
    return;
  }

  await pool.sql`
    UPDATE users
    SET
      stripe_subscription_id      = ${subscription.id},
      stripe_current_period_start = to_timestamp(${periodStart}),
      stripe_current_period_end   = to_timestamp(${periodEnd})
    WHERE email = ${customerEmail}
  `;
  console.log(
    `[stripe/webhook] Updated subscription period for ${customerEmail} (sub ${subscription.id})`
  );

  // §6 welcome email — FIRST invoice of a subscription only. Renewals fire
  // this same event (billing_reason "subscription_cycle") and must NOT
  // re-send. billing_reason "subscription_create" is the idiomatic flag
  // Stripe sets on the initial invoice.
  const billingReason = (invoice as unknown as { billing_reason?: string })
    .billing_reason;
  if (billingReason === "subscription_create") {
    const firstSubItem = subscription.items?.data?.[0];
    const priceId =
      typeof firstSubItem?.price === "string"
        ? firstSubItem.price
        : firstSubItem?.price?.id;
    const tool = priceId ? priceIdToWelcomeTool(priceId) : null;
    if (!tool) {
      console.warn(
        `[stripe/webhook] invoice.payment_succeeded first-invoice: no welcome tool resolved for price ${priceId ?? "(none)"} — skipping welcome`
      );
    } else {
      await sendAndLogWelcome(tool, customerEmail, `sub ${subscription.id}`);
    }
  }
}

// ─── checkout.session.completed ─────────────────────────────────────────────
//
// One-time purchase branch of the §6 welcome email. Subscriptions complete
// via invoice.payment_succeeded above; we explicitly skip mode "subscription"
// here to avoid double-sending.

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Only fire for one-time checkouts. Subscription mode is handled upstream
  // by invoice.payment_succeeded + billing_reason "subscription_create".
  if (session.mode !== "payment") return;

  // Guard against unpaid / async_payment_pending sessions.
  if (session.payment_status !== "paid") return;

  const customerEmail =
    session.customer_email?.toLowerCase() ??
    session.customer_details?.email?.toLowerCase() ??
    null;
  if (!customerEmail) {
    console.warn(
      `[stripe/webhook] checkout.session.completed (${session.id}): no customer email resolved`
    );
    return;
  }

  // Resolve the tool from the purchased price. Need to retrieve the
  // line items — the session object itself doesn't include them by default.
  let priceId: string | undefined;
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 1 }
    );
    const firstItem = lineItems.data[0];
    priceId =
      typeof firstItem?.price === "string"
        ? firstItem.price
        : firstItem?.price?.id;
  } catch (err) {
    console.error(
      `[stripe/webhook] checkout.session.completed (${session.id}): listLineItems failed:`,
      err
    );
    return;
  }

  const tool = priceId ? priceIdToWelcomeTool(priceId) : null;
  if (!tool) {
    // Not all one-time checkouts are welcome-email-eligible (AGENT: Prompts
    // $4.99 and HR Package are deliberately excluded). Log at debug level.
    console.log(
      `[stripe/webhook] checkout.session.completed (${session.id}): price ${priceId ?? "(none)"} has no welcome tool mapping — skipping`
    );
    return;
  }

  await sendAndLogWelcome(tool, customerEmail, `session ${session.id}`);
}

// ─── Welcome email helper ───────────────────────────────────────────────────
//
// Thin wrapper that keeps the two trigger paths symmetric in logging and
// error handling. A failed welcome email should never cause Stripe to
// retry the whole event (the period-column update already succeeded and
// is the higher-priority side effect).

async function sendAndLogWelcome(
  tool: WelcomeTool,
  customerEmail: string,
  context: string
): Promise<void> {
  const result = await sendWelcomeEmail(tool, customerEmail);
  if (result.ok) {
    console.log(
      `[stripe/webhook] §6 welcome sent: ${customerEmail} (${tool}, ${context})`
    );
  } else {
    console.error(
      `[stripe/webhook] §6 welcome FAILED: ${customerEmail} (${tool}, ${context}):`,
      result.error ?? "unknown"
    );
  }
}

// ─── customer.subscription.deleted ──────────────────────────────────────────

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return;

  // AND-match the subscription_id so we don't accidentally clear a row that
  // was since overwritten by a different subscription on the same email.
  await pool.sql`
    UPDATE users
    SET
      stripe_subscription_id      = NULL,
      stripe_current_period_start = NULL,
      stripe_current_period_end   = NULL
    WHERE email = ${customer.email.toLowerCase()}
      AND stripe_subscription_id = ${subscription.id}
  `;
  console.log(
    `[stripe/webhook] Cleared subscription period for ${customer.email} (sub ${subscription.id})`
  );
}
