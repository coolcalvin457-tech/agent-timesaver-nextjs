import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request headers at runtime
export const dynamic = "force-dynamic";

// ─── Stripe Checkout — HR Tools Package ───────────────────────────────────────
// Creates a hosted payment session for the HR Tools Package founding access.
// On success, Stripe redirects to /onboarding?payment=success&session_id=xxx
// On cancel,  Stripe redirects to /onboarding?payment=cancelled

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe secret key not configured" },
        { status: 500 }
      );
    }

    // Derive base URL from the incoming request so this works on localhost,
    // preview deployments, and production without extra env vars.
    const origin = req.headers.get("origin") ?? "https://promptaiagents.com";

    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": "HR Tools Package — Founding Access",
      "line_items[0][price_data][product_data][description]":
        "AGENT: Onboarding is live today. AGENT: PIP, Performance Review Builder, and more ship next — all included at no extra cost.",
      "line_items[0][price_data][unit_amount]": "4900",
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: `${origin}/onboarding?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboarding?payment=cancelled`,
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
    console.error("Onboarding kit checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
