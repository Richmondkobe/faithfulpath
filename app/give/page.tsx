import type { Metadata } from "next";
import Link from "next/link";
import GiftChoice from "@/components/give/GiftChoice";
import { socialMeta } from "@/lib/social-meta";
import { DEFAULT_MONTHLY, DEFAULT_ONCE, GIFT_NOTE, MONTHLY_AMOUNTS, ONCE_AMOUNTS } from "@/lib/giving";

const TITLE = "Support the Ministry";
const DESCRIPTION =
  "Support the ministry of Pastor Richmond Kobe and the Faithful Path Community, monthly as a Ministry Partner or with a one-time gift.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/give" },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: "/give" }),
};

const DISPLAY = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

type Props = { searchParams: Promise<{ error?: string }> };

/**
 * /give — "Support the Ministry". Two choices side by side (one above the
 * other on a phone), monthly first and marked Recommended. Each posts to
 * /api/give/checkout, which opens Stripe Checkout.
 */
export default async function Give({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main>
      <section className="bg-navy">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-12 text-center sm:px-6 sm:pt-16">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Faithful Path Community</p>
          <h1 className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-sun sm:text-[3rem]" style={DISPLAY}>
            Support the Ministry
          </h1>
          {/* Richmond's message; his to edit. */}
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-sand">
            Many of you have asked how you can support this ministry. Your gift helps us keep teaching, praying with
            people, and building a community where believers grow and help others follow Jesus. Thank you for walking
            with us.
          </p>
          <p className="mt-4 text-sand" style={DISPLAY}>
            Pastor Richmond Kobe
          </p>
        </div>
      </section>

      <div id="give" className="mx-auto max-w-4xl scroll-mt-6 px-4 pt-12 pb-20 sm:px-6">
        {error && (
          <p role="alert" className="mb-8 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-danger">
            {error}
          </p>
        )}
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
          <GiftChoice
            kind="monthly"
            amounts={MONTHLY_AMOUNTS}
            initial={DEFAULT_MONTHLY}
            title="Become a Ministry Partner"
            lead="Give every month and help the ministry plan ahead. Change or cancel any time."
            recommended
          />
          <GiftChoice
            kind="one_time"
            amounts={ONCE_AMOUNTS}
            initial={DEFAULT_ONCE}
            title="Give once"
            lead="A single gift, whenever you would like to give."
          />
        </div>

        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-line bg-paper px-5 py-4 text-center text-[15px] leading-relaxed text-ink">
          {GIFT_NOTE}
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-muted">
          Stripe emails you a receipt for every gift. Made a mistake, or want to change a monthly gift? Write to{" "}
          <a href="mailto:info@faithfulpathcommunity.com" className="text-gold-text underline underline-offset-4">
            info@faithfulpathcommunity.com
          </a>
          . See the{" "}
          <Link href="/terms#gifts" className="underline underline-offset-4">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
