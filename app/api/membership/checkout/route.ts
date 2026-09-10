import { NextResponse, type NextRequest } from "next/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { membershipPriceId } from "@/lib/members";
import { getSessionEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const origin = siteUrl();
    // If they happen to be signed in already, pay as that address — it is the
    // one their membership will be matched to.
    const email = await getSessionEmail();

    const form = await request.formData().catch(() => null);
    const typed = String(form?.get("email") ?? "").trim().toLowerCase();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: membershipPriceId(), quantity: 1 }],
      customer_email: email ?? (typed || undefined),
      allow_promotion_codes: true,
      success_url: `${origin}/membership/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/membership`,
    });

    if (!session.url) throw new Error("Stripe returned a session with no URL.");
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Membership checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
