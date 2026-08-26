import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { recordPurchase } from "@/lib/purchases";

// The signature is computed over the exact bytes Stripe sent, so the body has
// to be read raw — never request.json().
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      secret
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await recordPurchase(session);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Returning 500 makes Stripe retry, which is what we want for a transient
    // database failure — the insert is idempotent.
    console.error(`Failed handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
