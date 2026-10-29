import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { getPurchaseBySessionId, recordPurchase } from "@/lib/purchases";
import { getProductById } from "@/lib/products-db";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      {children}
    </main>
  );
}

export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <Shell>
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
          style={heading}
        >
          Nothing to show
        </h1>
        <p className="mt-5 leading-relaxed">
          This page appears after a purchase.{" "}
          <Link href="/guides" className="text-gold-text underline underline-offset-4">
            Browse the guides
          </Link>
          .
        </p>
      </Shell>
    );
  }

  // The webhook is the source of truth, but it can arrive after the redirect.
  // Fall back to reading the session straight from Stripe so the buyer is never
  // left staring at a blank page.
  let purchase = await getPurchaseBySessionId(sessionId);

  if (!purchase) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      purchase = await recordPurchase(session);
    } catch (err) {
      console.error("Could not confirm checkout session:", err);
    }
  }

  if (!purchase) {
    return (
      <Shell>
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
          style={heading}
        >
          Almost there
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed">
          Your payment is still settling. Refresh this page in a moment — and if
          the link still has not appeared, email us and we will send the guide
          straight to you.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Contact us
        </Link>
      </Shell>
    );
  }

  const product = await getProductById(purchase.product_id);

  return (
    <Shell>
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
        style={heading}
      >
        Thank you
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {product ? `${product.title} is ready to download.` : "Your guide is ready to download."}
      </p>

      <div className="mt-10 rounded-xl border border-line bg-sand px-7 py-8">
        <a
          href={`/api/download/${purchase.download_token}`}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Download the PDF
        </a>
        {purchase.email ? (
          <>
            <p className="mt-5 max-w-lg leading-relaxed">
              We are also emailing {product ? product.title : "your book"} to{" "}
              <span className="break-words font-semibold text-navy">{purchase.email}</span>, with this download
              link. It can take a few minutes; if it has not arrived, check your spam folder.
            </p>
            <p className="mt-3 max-w-lg leading-relaxed">
              You can download it again any time from <strong>Your books</strong>:{" "}
              <Link href="/members/login" className="font-semibold text-gold-text underline underline-offset-4">
                sign in
              </Link>{" "}
              with that email address.
            </p>
          </>
        ) : (
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">
            Keep this link — it stays valid, so you can come back to it.
          </p>
        )}
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <Link
          href="/guides"
          className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
        >
          ← All guides
        </Link>
      </div>
    </Shell>
  );
}
