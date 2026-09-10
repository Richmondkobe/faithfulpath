import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { recordPurchase } from "@/lib/purchases";
import { syncMemberFromSubscription } from "@/lib/members";

/**
 * The webhook endpoint is pinned to its own Stripe API version, which is not the
 * one this SDK sends on outbound calls. Fields move between versions — in
 * 2025-02-24.acacia a subscription's current_period_end sits on the subscription
 * and an invoice names its subscription at the top level; in the SDK's own
 * version the period moved onto the subscription item and the invoice reference
 * moved under parent.
 *
 * So the membership handlers read exactly one thing out of a payload — an id,
 * which has never moved — and then fetch the subscription fresh through the SDK,
 * where the shape is whatever this SDK expects. Nothing else here depends on the
 * endpoint's version.
 */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const withLegacy = invoice as Stripe.Invoice & {
    // Present up to and including acacia; gone in later versions.
    subscription?: string | Stripe.Subscription | null;
    parent?: {
      subscription_details?: { subscription?: string | Stripe.Subscription | null };
    } | null;
  };

  const candidates = [
    withLegacy.subscription,
    withLegacy.parent?.subscription_details?.subscription,
    ...(invoice.lines?.data ?? []).map(
      (line) => (line as { subscription?: string | Stripe.Subscription | null }).subscription
    ),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) return candidate;
    if (candidate && typeof candidate === "object" && candidate.id) return candidate.id;
  }
  return null;
}

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
      // replays both settle on the same answer — and so the payload's API
      // version cannot matter. See the note above the file's imports.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncMemberFromSubscription(subscription.id);
        break;
      }

      // Renewals and failed payments.
      case "invoice.paid":
      case "invoice.payment_failed": {
        const id = subscriptionIdFromInvoice(event.data.object as Stripe.Invoice);
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
