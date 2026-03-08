import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request headers at runtime
export const dynamic = "force-dynamic";

// ─── Stripe Checkout — creates a hosted payment session ───────────────────────
// Uses Stripe REST API directly (no npm package needed).
// On success, Stripe redirects to /prompt-builder?payment=success&session_id=xxx
// On cancel,  Stripe redirects to /prompt-builder?payment=cancelled

export async function POST(req: NextRequest) {
  try {
    const { jobTitle } = await req.json();

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
      "line_items[0][price_data][product_data][name]": "AGENT: Prompt Builder",
      "line_items[0][price_data][product_data][description]": `12 personalized AI prompts built for ${jobTitle || "your role"} — plus an AI Profile and Build Your AI System guide.`,
      "line_items[0][price_data][unit_amount]": "499",
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: `${origin}/prompt-builder?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/prompt-builder?payment=cancelled`,
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
    console.error("Checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
