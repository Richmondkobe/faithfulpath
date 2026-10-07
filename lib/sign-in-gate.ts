import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/auth";
import { getMemberByEmail } from "@/lib/members";
import { isCourseSession, recordCoursePurchase } from "@/lib/following-jesus-access";

/**
 * Whether the email-and-code sign-in may send a code to this address.
 *
 * From 18 September 2026 a robot typed other people's addresses into the form
 * about fifteen times a day. Each one created an account and emailed a
 * stranger a code: 247 accounts, none of which owned anything, and a steady
 * risk to the site's email reputation. Only someone who has paid has anything
 * to sign in to, so a code now goes only to:
 *
 *   * the admin address;
 *   * anyone with a membership row, in any status (a lapsed member can still
 *     reach their journal);
 *   * anyone with a Following Jesus purchase;
 *   * anyone Stripe shows completed a membership or course checkout in the
 *     last day, for the buyer whose payment record has not arrived yet. A
 *     course sale found this way is recorded, exactly as the thank-you page
 *     does; a membership is only read here, and its row is left to the webhook.
 *
 * Everyone else sees the same "check your email" as before and is sent
 * nothing, so the form still does not say who has paid.
 */
export async function maySendSignInCode(email: string): Promise<boolean> {
  if (email === ADMIN_EMAIL) return true;

  if (await getMemberByEmail(email)) return true;

  const { count, error } = await supabaseAdmin
    .from("course_purchases")
    .select("id", { count: "exact", head: true })
    .eq("email", email);
  if (error) throw new Error(`Could not check course purchases: ${error.message}`);
  if (count) return true;

  return paidJustNow(email);
}

const RECENT_SECONDS = 24 * 60 * 60;

async function paidJustNow(email: string): Promise<boolean> {
  const sessions = await stripe.checkout.sessions.list({
    customer_details: { email },
    created: { gte: Math.floor(Date.now() / 1000) - RECENT_SECONDS },
    status: "complete",
    limit: 20,
  });

  for (const session of sessions.data as Stripe.Checkout.Session[]) {
    if (session.mode === "subscription") return true;
    if (isCourseSession(session) && session.payment_status === "paid") {
      await recordCoursePurchase(session);
      return true;
    }
  }
  return false;
}
