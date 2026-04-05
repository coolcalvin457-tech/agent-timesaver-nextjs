import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Verify Competitive Dossier Subscription ─────────────────────────────────
// Called from the paywall screen when a returning user claims they already
// have a Competitive Dossier subscription.
// Looks up the email in Stripe, checks for an active CD subscription.

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ verified: false }, { status: 500 });
    }

    const body = await req.json() as { email?: string };
    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    // Step 1: Find Stripe customer(s) by email
    const customersRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=5`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    if (!customersRes.ok) {
      return NextResponse.json({ verified: false }, { status: 500 });
    }

    const customers = await customersRes.json() as { data: Array<{ id: string }> };
    if (!customers.data || customers.data.length === 0) {
      return NextResponse.json({ verified: false });
    }

    // Step 2: Check for active CD subscription
    const priceId = process.env.STRIPE_COMPETITIVE_DOSSIER_PRICE_ID;

    for (const customer of customers.data) {
      const subsRes = await fetch(
        `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=10`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );
      if (!subsRes.ok) continue;

      const subs = await subsRes.json() as {
        data: Array<{ items: { data: Array<{ price: { id: string } }> } }>;
      };

      for (const sub of subs.data ?? []) {
        for (const item of sub.items?.data ?? []) {
          if (!priceId || item.price?.id === priceId) {
            return NextResponse.json({ verified: true });
          }
        }
      }
    }

    return NextResponse.json({ verified: false });
  } catch (error) {
    console.error("Verify CD subscription error:", error);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
