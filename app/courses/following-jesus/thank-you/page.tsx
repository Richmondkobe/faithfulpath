import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { COURSES, OFFERS, SERIES_PATH, coursePath, isOfferId } from "@/lib/following-jesus";
import { getLearner, isCourseSession, recordCoursePurchase } from "@/lib/following-jesus-access";

export const metadata: Metadata = {
  title: "Thank you | Following Jesus | Faithful Path Community",
  robots: { index: false, follow: false },
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const button =
  "inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">Following Jesus</p>
      <h1
        className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={heading}
      >
        {title}
      </h1>
      {children}
    </main>
  );
}

export default async function FollowingJesusThankYou({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const begin = coursePath(COURSES[0]);

  // The webhook records the sale, but can arrive after this redirect. Reading
  // the session and recording it here too is safe: the write is idempotent.
  let paid: { email: string; title: string } | null = null;
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const offer = session.metadata?.course_offer;
      if (isCourseSession(session) && isOfferId(offer) && session.payment_status === "paid") {
        await recordCoursePurchase(session);
        const email = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
        paid = { email, title: OFFERS[offer].title };
      }
    } catch (err) {
      console.error("Could not confirm course checkout session:", err);
    }
  }

  if (!paid) {
    return (
      <Shell title="We couldn’t find your payment">
        <p className="mt-6 leading-relaxed">
          This page appears after buying a course. If you have just paid and see
          this, your receipt is on its way by email; you can{" "}
          <Link href={`${SERIES_PATH}/sign-in?next=${encodeURIComponent(begin)}`} className="text-[#8B5E34] underline underline-offset-4">
            sign in
          </Link>{" "}
          with the email you paid with, or{" "}
          <Link href="/contact" className="text-[#8B5E34] underline underline-offset-4">
            contact us
          </Link>{" "}
          and we will sort it out.
        </p>
      </Shell>
    );
  }

  const learner = await getLearner();
  const signedInAsBuyer = learner?.email === paid.email;

  return (
    <Shell title="Thank you">
      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        {paid.title} is yours. A receipt is on its way to{" "}
        <span className="break-words text-[#2B2118]">{paid.email}</span>.
      </p>

      {signedInAsBuyer ? (
        <div className="mt-10">
          <Link href={`${begin}/lesson-01`} className={button}>
            Start Lesson 1
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 leading-relaxed">
            To open the course, sign in with <strong className="font-medium text-[#2B2118]">{paid.email}</strong>,
            the email you paid with. We will email you a 6-digit code — there is
            no password to remember.
          </p>
          <div className="mt-10">
            <Link
              href={`${SERIES_PATH}/sign-in?next=${encodeURIComponent(begin)}&email=${encodeURIComponent(paid.email)}`}
              className={button}
            >
              Sign in and start
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}
