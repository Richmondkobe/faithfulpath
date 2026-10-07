import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, siteUrl } from "@/lib/stripe";
import { COURSES, OFFERS, SERIES_PATH, canBuy, coursePath, isOfferId } from "@/lib/following-jesus";
import { getLearner, getOwnedOffers } from "@/lib/following-jesus-access";

/**
 * Stripe Checkout for a Following Jesus offer, in the pattern the Books store
 * uses: a one-time payment, the price set here from lib/following-jesus.ts and
 * never from the form, the sale recorded by the webhook. Nothing is created in
 * Stripe ahead of time — no product, no price.
 */
export async function POST(request: NextRequest) {
  const begin = coursePath(COURSES[0]);
  try {
    const form = await request.formData();
    const offerId = form.get("offer");
    if (!isOfferId(offerId)) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    const offer = OFFERS[offerId];
    const origin = siteUrl();

    // Someone signed in who already has everything this offer opens is sent
    // back to their course rather than charged twice. (A Begin owner buying
    // all four still can: it opens three more courses. Full price for now; an
    // upgrade price comes before Establish launches.)
    // Nobody pays twice for what they have (see canBuy): a Begin owner gets
    // the upgrade rather than the bundle, the upgrade needs a signed-in Begin
    // owner, and someone with all four is sent back to their course.
    const learner = await getLearner();
    const owned = learner ? await getOwnedOffers() : new Set<never>();
    if (!canBuy(offer.id, owned, learner !== null)) {
      return NextResponse.redirect(`${origin}${begin}${learner ? "#your-course" : "#buy"}`, 303);
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: offer.priceCents,
            product_data: { name: offer.title },
          },
        },
      ],
      allow_promotion_codes: true,
      // Signed in: pay with that email, so the purchase lands on the account
      // they are already using. Signed out: Checkout asks, and they sign in
      // afterwards with whatever they typed.
      ...(learner ? { customer_email: learner.email } : {}),
      // As for books: "all sales final" holds for a UK or EU buyer only if they
      // agreed to immediate access. Wording approved by Richmond, 6 October 2026.
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            "I agree to immediate access to this course and understand that I lose the right to cancel once I open it.",
        },
      },
      metadata: { course_offer: offer.id },
      payment_intent_data: {
        description: offer.title,
        metadata: { course_offer: offer.id },
      },
      success_url: `${origin}${SERIES_PATH}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${begin}#buy`,
    };

    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) throw new Error("Stripe returned a session with no URL.");

    // 303 so the browser follows with GET after the form POST.
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Course checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
