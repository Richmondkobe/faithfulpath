import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isOfferId, offersOpenCourse, type FjCourse, type FjOfferId } from "@/lib/following-jesus";

/* ----------------------------------------------------------------- access */

export type Learner = { userId: string; email: string };

/** The signed-in person, verified with Supabase rather than read off a cookie. */
export async function getLearner(): Promise<Learner | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { userId: user.id, email: user.email.toLowerCase() };
}

/**
 * The offers the signed-in person has bought.
 *
 * Read through their own session, not the service-role key: the select policy
 * on course_purchases compares the row's email with the one in their sign-in,
 * exactly and case-insensitively, so the database itself decides which rows
 * are theirs. There is no email filter here to get wrong.
 */
export async function getOwnedOffers(): Promise<Set<FjOfferId>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("course_purchases").select("offer");
  if (error) throw new Error(`Could not load course purchases: ${error.message}`);
  return new Set((data ?? []).map((row) => row.offer).filter(isOfferId));
}

/**
 * The learner, if they may open this course's lessons; otherwise null.
 * Signed out, not bought, and not yet launched all come back null.
 */
export async function learnerWithAccess(course: FjCourse): Promise<Learner | null> {
  const learner = await getLearner();
  if (!learner) return null;
  return offersOpenCourse(await getOwnedOffers(), course) ? learner : null;
}

/* -------------------------------------------------------------- purchases */

/**
 * Write the purchase row for a paid Following Jesus Checkout Session.
 *
 * Idempotent, as recordPurchase is for books: Stripe retries webhooks and the
 * thank-you page calls this too in case it arrives first, and the unique
 * stripe_session_id makes the second write a no-op. Only ever adds a row.
 */
export async function recordCoursePurchase(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") return;

  const offer = session.metadata?.course_offer;
  if (!isOfferId(offer)) {
    console.error(`Checkout session ${session.id} has no valid course_offer metadata.`);
    return;
  }

  const email = (session.customer_details?.email ?? session.customer_email ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    // Without an email there is no way to match the buyer to a sign-in.
    // Thrown, so the webhook answers 500 and Stripe retries.
    throw new Error(`Checkout session ${session.id} has no customer email.`);
  }

  const { error } = await supabaseAdmin.from("course_purchases").insert({
    email,
    offer,
    amount_cents: session.amount_total ?? 0,
    stripe_session_id: session.id,
  });

  // Unique violation: this session is already recorded. That is the
  // idempotency working, not a failure.
  if (error && error.code !== "23505") {
    throw new Error(`Could not record course purchase: ${error.message}`);
  }
}

/** Whether a Checkout Session is a Following Jesus sale rather than a book or membership. */
export function isCourseSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.course_offer !== undefined;
}
