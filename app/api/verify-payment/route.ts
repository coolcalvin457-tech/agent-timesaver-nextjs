import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request.url at runtime
export const dynamic = "force-dynamic";

// ─── Verify Payment — confirms a Stripe Checkout session was paid ─────────────
// Called client-side after Stripe redirects back with ?session_id=xxx
// Returns { verified: true } only if payment_status === "paid"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { verified: false, error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!stripeRes.ok) {
      console.error("Stripe verify error:", await stripeRes.text());
      return NextResponse.json({ verified: false }, { status: 500 });
    }

    const session = await stripeRes.json();
    const verified = session.payment_status === "paid";

    return NextResponse.json({ verified });
  } catch (error) {
    console.error("Verify payment route error:", error);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
