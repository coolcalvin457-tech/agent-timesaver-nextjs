import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request headers at runtime
export const dynamic = "force-dynamic";

// ─── Stripe Checkout — AGENT: Workflow Builder ────────────────────────────────
// Standalone checkout route for the Workflow Builder subscription ($49/year).
// Separate from the HR Agents Package — this is its own Stripe product.
//
// IMPORTANT: STRIPE_WORKFLOW_BUILDER_PRICE_ID must be set in Vercel before going live.
// Create the Stripe product ("AGENT: Workflow Builder", $49/year recurring) in the
// Stripe dashboard, copy the Price ID, and add it as STRIPE_WORKFLOW_BUILDER_PRICE_ID.
//
// On success: Stripe redirects to {origin}/workflow-builder?payment=success&session_id=xxx
// On cancel:  Stripe redirects to {origin}/workflow-builder?payment=cancelled

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe secret key not configured" },
        { status: 500 }
      );
    }

    const priceId = process.env.STRIPE_WORKFLOW_BUILDER_PRICE_ID;
    if (!priceId) {
      console.error(
        "STRIPE_WORKFLOW_BUILDER_PRICE_ID is not set. Create the Workflow Builder product " +
        "in Stripe ($49/year subscription) and add the Price ID to Vercel env vars."
      );
      return NextResponse.json(
        { error: "Workflow Builder price not configured. Contact support." },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") ?? "https://promptaiagents.com";

    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${origin}/workflow-builder?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/workflow-builder?payment=cancelled`,
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
    console.error("Workflow Builder checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
