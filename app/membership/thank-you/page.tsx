import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { sendSignInCode } from "@/lib/sign-in-code";

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
  let codeSent = false;
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paidEmail =
        session.customer_details?.email?.trim().toLowerCase() ??
        (typeof session.customer_email === "string"
          ? session.customer_email.trim().toLowerCase()
          : null);
      // The page tells them a code has been sent, so send it: only for a
      // membership Stripe has confirmed, paid in the last day, to the address
      // it was paid with.
      const recent = Date.now() / 1000 - session.created < 24 * 60 * 60;
      if (paidEmail && session.mode === "subscription" && session.status === "complete" && recent) {
        codeSent = await sendSignInCode(paidEmail);
      }
    } catch (err) {
      console.error("Could not read the membership checkout session:", err);
    }
  }

  const signInHref = paidEmail
    ? `/members/login?email=${encodeURIComponent(paidEmail)}${codeSent ? "&sent=1" : ""}`
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
        Welcome to Faithful Path. Your membership is active. We have sent a
        six-digit code to the email you paid with. Enter it to open your
        courses. If it hasn&rsquo;t arrived in a few minutes, check your spam
        folder or email info@faithfulpathcommunity.com.
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
