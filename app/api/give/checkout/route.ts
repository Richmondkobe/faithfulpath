import { NextResponse, type NextRequest } from "next/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { GIFT_TYPE, MAX_GIFT, MIN_GIFT, parseGiftAmount } from "@/lib/giving";

/**
 * Starts a gift in Stripe Checkout: payment mode for a one-time gift,
 * subscription mode for a monthly Ministry Partner, in US dollars.
 *
 * Every gift carries metadata type=gift on the Checkout Session and on the
 * PaymentIntent or Subscription it creates, which is how the webhook keeps
 * it apart from books and the membership. The price is made here for the
 * amount given, so there is nothing to set up in Stripe first. Nobody is
 * signed in and nothing about a membership is read or passed: a gift is its
 * own customer in Stripe.
 */
export async function POST(request: NextRequest) {
  const origin = siteUrl();
  const back = (why: string) => NextResponse.redirect(`${origin}/give?error=${encodeURIComponent(why)}#give`, 303);

  const form = await request.formData().catch(() => null);
  const kind = form?.get("kind") === "monthly" ? "monthly" : "one_time";
  const picked = String(form?.get("amount") ?? "");
  const typed = String(form?.get("custom") ?? "");
  const cents = parseGiftAmount(picked === "other" ? typed : picked);
  if (!cents) return back(`Please choose an amount, or type one between US$${MIN_GIFT} and US$${MAX_GIFT.toLocaleString("en-US")}.`);

  const monthly = kind === "monthly";
  const metadata = { type: GIFT_TYPE, kind };
  const description = monthly ? "Monthly gift to Faithful Path Community" : "Gift to Faithful Path Community";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: monthly ? "subscription" : "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: cents,
            product_data: { name: monthly ? "Ministry Partner (monthly gift)" : "Gift to the ministry" },
            ...(monthly ? { recurring: { interval: "month" as const } } : {}),
          },
        },
      ],
      metadata,
      ...(monthly
        ? { subscription_data: { metadata, description } }
        : { submit_type: "donate" as const, payment_intent_data: { metadata, description } }),
      success_url: `${origin}/give/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/give#give`,
    });
    if (!session.url) throw new Error("Stripe returned a session with no URL.");
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Gift checkout error:", err);
    return back("We could not open the secure payment page just now. Please try again in a moment.");
  }
}
