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
 * Record a free claim as a purchase, so downloads, tokens and delivery all work
 * exactly as they do for a paid order.
 *
 * stripe_session_id is NOT NULL and UNIQUE, so free claims get a deterministic
 * synthetic id. That is what makes this idempotent: a second claim from the same
 * address collides on the unique constraint and returns the original row and
 * download token rather than creating a duplicate.
 */
export async function recordFreeClaim(
  productId: string,
  email: string
): Promise<Purchase> {
  const normalized = email.trim().toLowerCase();
  const syntheticId = `free:${productId}:${normalized}`;

  const existing = await getPurchaseBySessionId(syntheticId);
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("purchases")
    .insert({
      product_id: productId,
      email: normalized,
      amount_cents: 0,
      stripe_session_id: syntheticId,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const raced = await getPurchaseBySessionId(syntheticId);
      if (raced) return raced;
    }
    throw new Error(`Could not record claim: ${error.message}`);
  }

  return data as Purchase;
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
