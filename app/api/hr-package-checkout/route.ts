import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request headers at runtime
export const dynamic = "force-dynamic";

// ─── Stripe Checkout — HR Tools Package ───────────────────────────────────────
// Shared checkout route for all HR Tools Package purchases ($99/year subscription).
// Accepts optional successPath and cancelPath in the JSON request body.
// Uses STRIPE_HR_PACKAGE_PRICE_ID env var for the annual subscription price.
//
// IMPORTANT: STRIPE_HR_PACKAGE_PRICE_ID must be set in Vercel before going live.
// Create the Stripe product ("HR Tools Package", $99/year recurring) in the Stripe
// dashboard, copy the Price ID, and add it as STRIPE_HR_PACKAGE_PRICE_ID in Vercel.
//
// On success: Stripe redirects to {origin}/{successPath}?payment=success&session_id=xxx
// On cancel:  Stripe redirects to {origin}/{cancelPath}?payment=cancelled

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe secret key not configured" },
        { status: 500 }
      );
    }

    const priceId = process.env.STRIPE_HR_PACKAGE_PRICE_ID;
    if (!priceId) {
      console.error(
        "STRIPE_HR_PACKAGE_PRICE_ID is not set. Create the HR Tools Package product " +
        "in Stripe ($99/year subscription) and add the Price ID to Vercel env vars."
      );
      return NextResponse.json(
        { error: "HR Package price not configured. Contact support." },
        { status: 500 }
      );
    }

    // Derive base URL from the incoming request so this works on localhost,
    // preview deployments, and production without extra env vars.
    const origin = req.headers.get("origin") ?? "https://promptaiagents.com";

    // Accept tool-specific redirect paths from the request body.
    // Defaults to onboarding-kit-builder for backward compatibility.
    let successPath = "onboarding-kit-builder";
    let cancelPath = "onboarding-kit-builder";
    try {
      const body = await req.json() as { successPath?: string; cancelPath?: string };
      if (body.successPath) successPath = body.successPath;
      if (body.cancelPath) cancelPath = body.cancelPath;
    } catch {
      // No body or non-JSON body — use defaults
    }

    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${origin}/${successPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${cancelPath}?payment=cancelled`,
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
    console.error("HR package checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
