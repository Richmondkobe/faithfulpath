import { NextResponse } from "next/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail } from "@/lib/members";

/**
 * Opens the Stripe billing portal for the signed-in member. The customer id is
 * looked up from their session, never accepted from the request, so nobody can
 * open somebody else's billing.
 */
export async function POST() {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.redirect(`${siteUrl()}/members/login`, 303);

    const member = await getMemberByEmail(email);
    if (!member?.stripe_customer_id) {
      return NextResponse.redirect(`${siteUrl()}/members`, 303);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: member.stripe_customer_id,
      return_url: `${siteUrl()}/members`,
    });

    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Billing portal error:", err);
    return NextResponse.json(
      { error: "Could not open the billing portal. Please try again." },
      { status: 500 }
    );
  }
}
