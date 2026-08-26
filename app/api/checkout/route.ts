import { NextResponse, type NextRequest } from "next/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { getPublishedProductBySlug } from "@/lib/products-db";

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

    const session = await stripe.checkout.sessions.create({
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
      metadata: { product_id: product.id, slug: product.slug },
      payment_intent_data: {
        metadata: { product_id: product.id, slug: product.slug },
      },
      success_url: `${origin}/guides/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/guides/${product.slug}`,
    });

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
