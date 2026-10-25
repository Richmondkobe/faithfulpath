import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";
import { GIFT_TYPE, giftAmount, type GiftKind } from "@/lib/giving";

/**
 * Gifts, as the Stripe webhook records them. A gift is anything Stripe sends
 * with metadata type=gift; it is written to the gifts and ministry_partners
 * tables and nowhere else. It never reaches members, purchases or
 * course_purchases, and so never opens a course.
 */

export const isGiftSession = (s: Stripe.Checkout.Session) => s.metadata?.type === GIFT_TYPE;
export const isGiftSubscription = (s: Stripe.Subscription) => s.metadata?.type === GIFT_TYPE;

const lower = (s: string | null | undefined) => s?.trim().toLowerCase() || null;

/** A one-time gift, from its completed Checkout Session. */
export async function recordOneTimeGift(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "payment" || session.payment_status !== "paid") return;
  const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!ref || !session.amount_total) throw new Error(`Gift session ${session.id} has no payment or amount.`);

  const name = session.customer_details?.name ?? null;
  const email = lower(session.customer_details?.email);
  const inserted = await insertGift({
    stripe_ref: ref,
    kind: "one_time",
    amount_cents: session.amount_total,
    currency: session.currency ?? "usd",
    name,
    email,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    stripe_subscription_id: null,
    paid_at: new Date(session.created * 1000).toISOString(),
  });
  if (inserted) await notifyGift({ kind: "one_time", name, email, amountCents: session.amount_total });
}

/** One month of a monthly partnership, from its paid invoice. */
export async function recordMonthlyGift(invoice: Stripe.Invoice, subscription: Stripe.Subscription): Promise<void> {
  if (!invoice.id || !invoice.amount_paid) return;
  const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
  await insertGift({
    stripe_ref: invoice.id,
    kind: "monthly",
    amount_cents: invoice.amount_paid,
    currency: invoice.currency ?? "usd",
    name: invoice.customer_name ?? null,
    email: lower(invoice.customer_email),
    stripe_customer_id: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
    stripe_subscription_id: subscription.id,
    paid_at: new Date(paidAt * 1000).toISOString(),
  });
}

/** Inserts once: a repeated webhook finds the row already there. Returns whether it was new. */
async function insertGift(row: Record<string, unknown>): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("gifts")
    .upsert(row, { onConflict: "stripe_ref", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(`Could not record the gift: ${error.message}`);
  return Boolean(data?.length);
}

/**
 * Brings a monthly partner's row into line with Stripe, re-read fresh as the
 * membership does, and emails Richmond the first time a partner is seen.
 */
export async function syncPartner(subscriptionId: string): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["customer"] });
  if (!isGiftSubscription(sub)) return;
  const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
  const live = !customer.deleted ? customer : null;
  const item = sub.items.data[0];
  const amount = (item?.price?.unit_amount ?? 0) * (item?.quantity ?? 1);

  const { error } = await supabaseAdmin.from("ministry_partners").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: customer.id,
      name: live?.name ?? null,
      email: lower(live?.email),
      amount_cents: amount,
      currency: sub.currency,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      started_at: new Date(sub.start_date * 1000).toISOString(),
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) throw new Error(`Could not record the monthly partner: ${error.message}`);

  // Emailed once, by whichever event gets here first with a live partnership.
  if (sub.status !== "active" && sub.status !== "trialing") return;
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("ministry_partners")
    .update({ notified_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)
    .is("notified_at", null)
    .select("stripe_subscription_id");
  if (claimError) throw new Error(`Could not mark the partner as notified: ${claimError.message}`);
  if (claimed?.length) await notifyGift({ kind: "monthly", name: live?.name ?? null, email: lower(live?.email), amountCents: amount });
}

/** Emails Richmond about a new gift or a new monthly partner. Never throws: the gift is already recorded. */
async function notifyGift(g: { kind: GiftKind; name: string | null; email: string | null; amountCents: number }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set — gift recorded but not emailed.");
    return;
  }
  const from = process.env.RESEND_FROM ?? "Faithful Path <questions@faithfulpathcommunity.com>";
  const amount = g.kind === "monthly" ? `${giftAmount(g.amountCents)} a month` : giftAmount(g.amountCents);
  const subject = g.kind === "monthly" ? `New Ministry Partner: ${amount}` : `New gift: ${amount}`;
  const lines = [
    g.kind === "monthly" ? "Someone has become a monthly Ministry Partner." : "Someone has given a one-time gift.",
    "",
    `Name: ${g.name ?? "not given"}`,
    `Email: ${g.email ?? "not given"}`,
    `Amount: ${amount}`,
    `Type: ${g.kind === "monthly" ? "Monthly" : "One-time"}`,
    "",
    `All gifts: ${SITE.url}/admin/giving`,
  ];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from,
        to: ["info@faithfulpathcommunity.com"],
        ...(g.email ? { reply_to: g.email } : {}),
        subject,
        text: lines.join("\n"),
      }),
    });
    if (!res.ok) console.error("Resend error (gift):", res.status, await res.text());
  } catch (err) {
    console.error("Resend request failed (gift):", err);
  }
}
