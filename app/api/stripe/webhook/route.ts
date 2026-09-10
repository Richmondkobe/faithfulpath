import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { recordPurchase } from "@/lib/purchases";
import { syncMemberFromSubscription } from "@/lib/members";

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

        // Guides and memberships both land here. Without this branch a
        // membership signup would be written into purchases as a guide sale.
        if (session.mode === "subscription") {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;
          if (subscriptionId) await syncMemberFromSubscription(subscriptionId);
          break;
        }

        await recordPurchase(session);
        break;
      }

      // Every subscription change re-reads the subscription from Stripe rather
      // than applying the event as a delta, so out-of-order delivery and
      // replays both settle on the same answer.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncMemberFromSubscription(subscription.id);
        break;
      }

      // Renewals and failed payments: the invoice carries the subscription.
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id ??
              invoice.lines?.data.find((line) => line.subscription)?.subscription;
        const id =
          typeof subscriptionId === "string" ? subscriptionId : subscriptionId?.id;
        if (id) await syncMemberFromSubscription(id);
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
