import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request headers at runtime
export const dynamic = "force-dynamic";

// ─── Stripe Checkout — AGENT: Company ────────────────────────────────────────
// Checkout route for the AGENT: Company subscription ($149/year).
// Uses STRIPE_COMPETITIVE_DOSSIER_PRICE_ID env var.
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

    const priceId = process.env.STRIPE_COMPETITIVE_DOSSIER_PRICE_ID;
    if (!priceId) {
      console.error(
        "STRIPE_COMPETITIVE_DOSSIER_PRICE_ID is not set. Create the AGENT: Company " +
        "product in Stripe ($149/year subscription) and add the Price ID to Vercel env vars."
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
      mode: "subscription",
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
    console.error("Competitive dossier checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
