import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { isGiftSession } from "@/lib/giving-server";
import { giftAmount } from "@/lib/giving";
import { PORTAL_LABEL, STRIPE_PORTAL_LOGIN_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

const DISPLAY = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

type Props = { searchParams: Promise<{ session_id?: string; portal?: string }> };

/**
 * After a gift. The gift itself is recorded by the Stripe webhook, not here;
 * this page only reads the Checkout Session to thank the giver for the right
 * thing, and, for a monthly gift, offers Stripe's portal to change or cancel.
 */
export default async function GiveThankYou({ searchParams }: Props) {
  const { session_id: sessionId, portal } = await searchParams;

  let gift: { monthly: boolean; amount: string; name: string | null } | null = null;
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (isGiftSession(session) && session.status === "complete" && session.amount_total) {
        gift = {
          monthly: session.mode === "subscription",
          amount: giftAmount(session.amount_total),
          name: session.customer_details?.name?.trim().split(/\s+/)[0] ?? null,
        };
      }
    } catch (err) {
      console.error("Gift thank-you: could not read the session:", err instanceof Error ? err.message : err);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Support the Ministry</p>
      <h1 className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]" style={DISPLAY}>
        {gift?.name ? `Thank you, ${gift.name}` : "Thank you"}
      </h1>
      <p className="mt-6 text-lg leading-relaxed">
        {gift
          ? gift.monthly
            ? `Thank you for becoming a Ministry Partner with your gift of ${gift.amount} a month. `
            : `Thank you for your gift of ${gift.amount}. `
          : "Thank you for your gift. "}
        Your generosity helps us keep teaching, praying with people, and building a community where believers grow and
        help others follow Jesus. I am grateful you are walking with us.
      </p>
      <p className="mt-4 text-lg" style={DISPLAY}>
        Pastor Richmond Kobe
      </p>
      <p className="mt-6 leading-relaxed text-muted">
        Stripe will email you a receipt{gift?.monthly ? " now, and each month when your gift is made" : ""}.
      </p>

      {gift?.monthly && sessionId && (
        <section aria-labelledby="manage" className="mt-10 rounded-2xl border border-gold-line/60 bg-paper p-6">
          <h2 id="manage" className="text-xl text-navy" style={DISPLAY}>
            Change or cancel your monthly gift
          </h2>
          <p className="mt-2 leading-relaxed">
            You can cancel at any time, with no notice and no questions. The button opens Stripe&rsquo;s secure page
            for your gift, where you can cancel, or change the card it is paid from. If you cancel, no further gifts are
            taken. You can also write to info@faithfulpathcommunity.com and we will do it for you.
          </p>
          {portal === "failed" && (
            <p role="alert" className="mt-4 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger">
              That page could not be opened just now. Please try again, or write to info@faithfulpathcommunity.com.
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <form method="POST" action="/api/give/portal">
              <input type="hidden" name="session_id" value={sessionId} />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center rounded-xl border border-gold-line/60 bg-white px-6 text-[15px] font-semibold text-gold-text hover:border-gold-line"
              >
                Manage or cancel my monthly gift
              </button>
            </form>
            <a href={STRIPE_PORTAL_LOGIN_URL} className="min-h-11 content-center text-[15px] text-gold-text underline underline-offset-4 hover:text-navy">
              {PORTAL_LABEL}
            </a>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            The button opens your gift straight away from this page. The link works any time, from any device: type the
            email you gave with and Stripe emails you a sign-in link. It is also at the foot of every page, as
            &ldquo;Manage my subscription&rdquo;.
          </p>
        </section>
      )}

      <section aria-labelledby="community" className="mt-10 rounded-2xl bg-navy p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Free</p>
        <h2 id="community" className="mt-2 text-2xl text-sun" style={DISPLAY}>
          Join the Faithful Path Community
        </h2>
        <p className="mt-2 leading-relaxed text-sand">Prayer, a weekly gathering, and letters from Pastor Richmond.</p>
        <Link
          href="/community"
          className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-gold px-7 text-[15px] font-semibold text-night hover:bg-gold-soft"
        >
          Join free
        </Link>
      </section>
    </main>
  );
}
