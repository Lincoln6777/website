import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: NextRequest) {
  try {
    const { priceId } = (await request.json()) as { priceId?: string };
    const id = priceId ?? process.env.STRIPE_PRO_PRICE_ID;
    if (!id) {
      return NextResponse.json(
        { error: "Missing price ID" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: id, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?sub=pro`,
      cancel_url: `${baseUrl}/pro`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
