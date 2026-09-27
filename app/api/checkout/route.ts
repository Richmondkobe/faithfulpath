import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, siteUrl } from "@/lib/stripe";
import { getPublishedProductBySlug } from "@/lib/products-db";

/** Whether Stripe refused a session only because the ToS URL is not set. */
function isMissingTosUrl(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /terms.of.service/i.test(message) && /url|dashboard|settings/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const slug = String(form.get("slug") ?? "").trim();

    // The price comes from the database, never from the submitted form.
    const product = slug ? await getPublishedProductBySlug(slug) : null;

    if (!product) {
      return NextResponse.json({ error: "Guide not found." }, { status: 404 });
    }

    const origin = siteUrl();

    // The consent checkbox needs a Terms of service URL in the account's public
    // details, and test mode and live mode hold that setting separately. If it
    // is missing, Stripe refuses the whole session — which would stop every
    // purchase, not just the consent.
    //
    // So the consent is attempted, and a failure caused only by the missing URL
    // falls back to a session without it rather than breaking the store. The
    // fallback logs loudly, because while it is in use the "all sales final"
    // policy has no recorded agreement behind it for a UK or EU buyer. Set the
    // URL and this path stops being taken; it can be deleted once it is.
    const base: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: product.price_cents,
            product_data: {
              name: product.title,
              ...(product.subtitle ? { description: product.subtitle } : {}),
            },
          },
        },
      ],
      allow_promotion_codes: true,
      // "All sales final" only holds for a UK or EU buyer if they agreed to
      // immediate delivery and acknowledged losing the statutory cancellation
      // right. This is that agreement: a checkbox they have to tick before they
      // can pay, and a record on the session that they did.
      //
      // Stripe requires a terms of service URL in the account's public details
      // for this to be accepted — dashboard.stripe.com/settings/public. Without
      // it the session creation fails, which is why the catch below now says
      // which setting is missing rather than only "could not start checkout".
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            "I agree to immediate delivery of this PDF and understand that I lose the right to cancel once the download begins.",
        },
      },
      metadata: { product_id: product.id, slug: product.slug },
      payment_intent_data: {
        // Without this, the dashboard and the customer's receipt both show the
        // payment intent ID instead of what was actually bought.
        description: product.title,
        metadata: { product_id: product.id, slug: product.slug },
      },
      success_url: `${origin}/guides/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/guides/${product.slug}`,
    };

    let session;
    try {
      session = await stripe.checkout.sessions.create(base);
    } catch (err) {
      if (!isMissingTosUrl(err)) throw err;
      console.error(
        "STRIPE CONFIG: no Terms of service URL set in the account's public details " +
          "(dashboard.stripe.com/settings/public). Selling without the immediate-delivery " +
          "consent checkbox until it is set — the all-sales-final policy is unenforceable " +
          "for UK and EU buyers in the meantime."
      );
      const withoutConsent = { ...base };
      delete withoutConsent.consent_collection;
      delete withoutConsent.custom_text;
      session = await stripe.checkout.sessions.create(withoutConsent);
    }

    if (!session.url) {
      throw new Error("Stripe returned a session with no URL.");
    }

    // 303 so the browser follows with GET after the form POST.
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
