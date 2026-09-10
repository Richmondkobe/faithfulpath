import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type MemberStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type Member = {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: MemberStatus;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

/** Statuses that should open the members area. past_due deliberately does not. */
export function isActive(member: Member | null): boolean {
  return member?.status === "active" || member?.status === "trialing";
}

/** A member whose payment is failing still has a row, and should be told to fix the card. */
export function needsBilling(member: Member | null): boolean {
  return member?.status === "past_due" || member?.status === "unpaid";
}

export function membershipPriceId(): string {
  const price = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
  if (!price) {
    throw new Error("STRIPE_MEMBERSHIP_PRICE_ID is not set.");
  }
  return price;
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) throw new Error(`Could not load member: ${error.message}`);
  return (data as Member) ?? null;
}

function customerEmail(customer: Stripe.Customer | Stripe.DeletedCustomer): string | null {
  if (customer.deleted) return null;
  return customer.email?.trim().toLowerCase() ?? null;
}

/**
 * One writer for every subscription event.
 *
 * Webhooks arrive out of order and can be replayed, so rather than applying each
 * event as a delta this re-reads the subscription from Stripe and writes the
 * current truth. Replaying an old event is then harmless.
 */
export async function syncMemberFromSubscription(
  subscriptionId: string
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["customer"],
  });

  const customer = subscription.customer as Stripe.Customer | Stripe.DeletedCustomer;
  const customerId = typeof customer === "string" ? customer : customer.id;
  const email = typeof customer === "string" ? null : customerEmail(customer);

  // In current Stripe API versions the period lives on the subscription item,
  // not on the subscription.
  const periodEnd = subscription.items.data[0]?.current_period_end ?? null;

  const fields = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status as MemberStatus,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  };

  // Match on the Stripe customer first — it survives an email change — and fall
  // back to the address, which is all a brand new subscription has to go on.
  const { data: byCustomer } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  const existing =
    byCustomer ??
    (email
      ? (await supabaseAdmin.from("members").select("id").ilike("email", email).maybeSingle()).data
      : null);

  if (existing) {
    const { error } = await supabaseAdmin
      .from("members")
      .update(email ? { ...fields, email } : fields)
      .eq("id", existing.id);
    if (error) throw new Error(`Could not update member: ${error.message}`);
    return;
  }

  if (!email) {
    throw new Error(`Subscription ${subscription.id} has no customer email to match on.`);
  }

  const { error } = await supabaseAdmin.from("members").insert({ email, ...fields });
  if (error) throw new Error(`Could not create member: ${error.message}`);
}
