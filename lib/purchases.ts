import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Purchase } from "@/lib/products";

export async function getPurchaseBySessionId(
  sessionId: string
): Promise<Purchase | null> {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) throw new Error(`Could not load purchase: ${error.message}`);
  return (data as Purchase) ?? null;
}

export async function getPurchaseByToken(
  token: string
): Promise<Purchase | null> {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .eq("download_token", token)
    .maybeSingle();

  if (error) throw new Error(`Could not load purchase: ${error.message}`);
  return (data as Purchase) ?? null;
}

/**
 * Write the purchase row for a paid Checkout Session. Idempotent: Stripe retries
 * webhooks, and the thank-you page calls this too in case it beats the webhook,
 * so this can run several times for one session.
 */
export async function recordPurchase(
  session: Stripe.Checkout.Session
): Promise<Purchase | null> {
  if (session.payment_status !== "paid") return null;

  const existing = await getPurchaseBySessionId(session.id);
  if (existing) return existing;

  const productId = session.metadata?.product_id;
  if (!productId) {
    console.error(`Checkout session ${session.id} has no product_id metadata.`);
    return null;
  }

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  const { data, error } = await supabaseAdmin
    .from("purchases")
    .insert({
      product_id: productId,
      email,
      amount_cents: session.amount_total ?? 0,
      stripe_session_id: session.id,
    })
    .select("*")
    .single();

  if (error) {
    // Unique violation: another concurrent call (webhook vs thank-you page)
    // inserted it first. Read theirs instead of failing.
    if (error.code === "23505") return getPurchaseBySessionId(session.id);
    throw new Error(`Could not record purchase: ${error.message}`);
  }

  return data as Purchase;
}
