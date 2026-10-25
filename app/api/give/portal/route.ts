import { NextResponse, type NextRequest } from "next/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { isGiftSession } from "@/lib/giving-server";

/**
 * "Manage or cancel your monthly gift", from the thank-you page: opens
 * Stripe's customer portal for the customer of that monthly gift's Checkout
 * Session. Only for a gift session in subscription mode, so it can never open
 * a membership's billing; the customer is taken from Stripe, never from the
 * request.
 */
export async function POST(request: NextRequest) {
  const origin = siteUrl();
  const form = await request.formData().catch(() => null);
  const sessionId = String(form?.get("session_id") ?? "");
  try {
    if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("No session.");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!isGiftSession(session) || session.mode !== "subscription" || !customer) throw new Error("Not a monthly gift.");
    const portal = await stripe.billingPortal.sessions.create({ customer, return_url: `${origin}/give` });
    return NextResponse.redirect(portal.url, 303);
  } catch (err) {
    console.error("Gift portal error:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${origin}/give/thank-you?session_id=${encodeURIComponent(sessionId)}&portal=failed`, 303);
  }
}
