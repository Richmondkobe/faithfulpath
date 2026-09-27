import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, siteUrl } from "@/lib/stripe";
import { getPublishedProductBySlug } from "@/lib/products-db";

/**
 * Whether Stripe refused a session because the ToS URL is not set.
 *
 * Only used to say so in the log. The session is not retried without the
 * consent: a book sale that did not collect the immediate-delivery agreement
 * is a sale the refund policy does not cover, so it is better not made.
 */
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

    // The consent is not optional. Stripe refuses the whole session if the
    // account has no Terms of service URL, and that refusal is allowed to stand:
    // "all sales final" only holds against a UK or EU buyer who agreed to
    // immediate delivery, so a sale made without collecting that agreement is
    // one the policy does not cover. Failing here is loud and fixable; selling
    // without it is quiet and is not.
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
      if (isMissingTosUrl(err)) {
        console.error(
          "STRIPE CONFIG: no Terms of service URL in the account's public details for this " +
            "mode (dashboard.stripe.com/settings/public — test and live hold it separately). " +
            "Book checkout is refusing to sell rather than sell without the immediate-delivery " +
            "consent. Set it to https://faithfulpathcommunity.com/terms."
        );
      }
      throw err;
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
