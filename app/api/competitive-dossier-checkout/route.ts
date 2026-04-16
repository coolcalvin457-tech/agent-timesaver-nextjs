import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request headers at runtime
export const dynamic = "force-dynamic";

// ─── Stripe Checkout — AGENT: Company ────────────────────────────────────────
// Dual-mode checkout: one-time ($29 per dossier) or annual subscription ($149/yr).
// Default is one-time (primary purchase path). Annual is triggered by
// passing { type: "annual" } in the request body (used by sent-screen upsell).
//
// Env vars required in Vercel:
//   STRIPE_COMPANY_ONETIME_PRICE_ID  ($29 per dossier)
//   STRIPE_COMPANY_ANNUAL_PRICE_ID   ($149/yr recurring)
//
// On success: Stripe redirects to {origin}/company?payment=success&session_id=xxx
// On cancel:  Stripe redirects to {origin}/company?payment=cancelled

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe secret key not configured" },
        { status: 500 }
      );
    }

    // Determine purchase type from request body. Default: one-time.
    const body = await req.json().catch(() => ({}));
    const purchaseType = body.type === "annual" ? "annual" : "one-time";

    const onetimePriceId = process.env.STRIPE_COMPANY_ONETIME_PRICE_ID;
    const annualPriceId = process.env.STRIPE_COMPANY_ANNUAL_PRICE_ID;

    const priceId = purchaseType === "annual" ? annualPriceId : onetimePriceId;
    const stripeMode = purchaseType === "annual" ? "subscription" : "payment";

    if (!priceId) {
      console.error(
        `STRIPE_COMPANY_${purchaseType === "annual" ? "ANNUAL" : "ONETIME"}_PRICE_ID is not set. ` +
        "Add the Price ID to Vercel env vars."
      );
      return NextResponse.json(
        { error: "AGENT: Company price not configured. Contact support." },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") ?? "https://promptaiagents.com";

    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: stripeMode,
      success_url: `${origin}/company?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/company?payment=cancelled`,
    });

    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      console.error("Stripe checkout error:", err);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("AGENT: Company checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
