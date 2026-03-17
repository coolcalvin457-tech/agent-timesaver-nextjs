import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering — this route reads request body at runtime
export const dynamic = "force-dynamic";

// ─── Verify Subscription — returning purchaser email check ───────────────────
// Called from the paywall screen when a user claims they already have access.
// Looks up the email in Stripe, checks for an active HR Tools Package subscription.
// Returns { verified: true } if an active subscription is found.
//
// Flow: user enters email → POST here → if verified, skip Stripe → go straight to loading.

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
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    if (!customersRes.ok) {
      console.error("Stripe customer lookup error:", await customersRes.text());
      return NextResponse.json({ verified: false }, { status: 500 });
    }

    const customers = await customersRes.json() as {
      data: Array<{ id: string }>;
    };

    if (!customers.data || customers.data.length === 0) {
      // No Stripe customer found for this email
      return NextResponse.json({ verified: false });
    }

    // Step 2: Check each customer for an active subscription
    const priceId = process.env.STRIPE_HR_PACKAGE_PRICE_ID;

    for (const customer of customers.data) {
      const subsRes = await fetch(
        `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=10`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );

      if (!subsRes.ok) continue;

      const subs = await subsRes.json() as {
        data: Array<{
          items: { data: Array<{ price: { id: string } }> };
        }>;
      };

      for (const sub of subs.data ?? []) {
        for (const item of sub.items?.data ?? []) {
          // If STRIPE_HR_PACKAGE_PRICE_ID is configured, match against it.
          // Otherwise any active subscription counts — only one product exists at launch.
          if (!priceId || item.price?.id === priceId) {
            return NextResponse.json({ verified: true });
          }
        }
      }
    }

    // Customer exists in Stripe but no active HR Tools subscription found
    return NextResponse.json({ verified: false });
  } catch (error) {
    console.error("Verify subscription route error:", error);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
