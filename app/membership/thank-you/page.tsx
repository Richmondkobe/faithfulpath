import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Welcome | Faithful Path Community",
  robots: { index: false, follow: false },
};

export default async function MembershipThankYou({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  // The address they paid with is the only one that will open the membership,
  // so show it and carry it into the sign-in form rather than letting them
  // guess at a different one.
  let paidEmail: string | null = null;
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paidEmail =
        session.customer_details?.email?.trim().toLowerCase() ??
        (typeof session.customer_email === "string"
          ? session.customer_email.trim().toLowerCase()
          : null);
    } catch (err) {
      console.error("Could not read the membership checkout session:", err);
    }
  }

  const signInHref = paidEmail
    ? `/members/login?email=${encodeURIComponent(paidEmail)}`
    : "/members/login";

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        You&rsquo;re in
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Placeholder confirmation copy. Your membership is active.
      </p>

      {paidEmail ? (
        <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            You paid as
          </p>
          <p className="mt-1 break-words text-lg text-[#2B2118]">{paidEmail}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">
            Sign in with this address — it is the one your membership is attached
            to. Another address will not find it.
          </p>
        </div>
      ) : (
        <p className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 text-sm leading-relaxed text-[#6B5F53]">
          Sign in with the email address you paid with — it is the one your
          membership is attached to.
        </p>
      )}

      <Link
        href={signInHref}
        className="mt-8 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
      >
        {paidEmail ? `Log in as ${paidEmail}` : "Log in"}
      </Link>
    </main>
  );
}
