import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive, needsBilling } from "@/lib/members";
import { getOwnedOffers } from "@/lib/following-jesus-access";
import { SERIES_PATH } from "@/lib/following-jesus";
import { PORTAL_LABEL, STRIPE_PORTAL_LOGIN_URL } from "@/lib/site";
import { memberLogout } from "@/app/members/actions";
import JournalButton from "@/components/course/JournalButton";
import MemberQuestionForm from "@/components/MemberQuestionForm";
import MindCourseCard from "@/components/mind/MindCourseCard";
import LbyrCourseCard from "@/components/lbyr/LbyrCourseCard";
import BysyNewEditionCard from "@/components/bysy/BysyNewEditionCard";
import TbymNewEditionCard from "@/components/tbym/TbymNewEditionCard";
import { LBYR_PUBLISHED } from "@/lib/lbyr-links";
import { LBYR_NEW_LIVE, LBYR_OLD_RETIRED } from "@/lib/lbyr-new-live";
import LbyrNewEditionCard from "@/components/lbyr/LbyrNewEditionCard";
import { getQuestionAllowance, formatOpensOn } from "@/lib/questions";
import NewEditionCard from "@/components/reset-new/NewEditionCard";

// Written for both courses. The route chooser and Quick Start it used to name
// belong to the Spiritual Reset alone; what is said here has to be true of the
// other course as well, so the wayfinding moved to each course's own home and
// this says only what both share.
const WELCOME = [
  "You are in the right place.",
  "Everything here moves at a pace you can safely manage. There are no grades, deadlines, or rewards for finishing quickly. You may shorten an exercise, pause a session, or come back to it later.",
  "There are five courses below. Begin with any of them; none has to be finished before another is started.",
  "Each begins by asking what you have room for today, and each keeps a shorter way in for when that is very little.",
  "If your mind is restless right now, you do not have to start at the beginning. There is a page that takes you straight to the part that matches.",
  "You do not have to carry the whole course at once.",
  "The rest will be here when you are ready.",
];

export const metadata: Metadata = {
  title: "Members",
  robots: { index: false, follow: false },
};

async function QuestionSection() {
  let allowance;
  try {
    allowance = await getQuestionAllowance();
  } catch (err) {
    // Same reasoning as the course card: /members must not break because one
    // table is unreadable.
    console.error("Question section hidden — could not read allowance:", err);
    return null;
  }

  return (
    <section className="mt-12 border-t border-line pt-10">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Ask Pastor Richmond
      </h2>
      <p className="mt-3 leading-relaxed">
        One written question a month, answered personally. Take as long as you
        need to write it.
      </p>

      {allowance.used ? (
        <p className="mt-6 rounded-xl border border-line bg-sand px-5 py-4 leading-relaxed text-muted">
          You have used this month&rsquo;s question; your next one opens on{" "}
          {formatOpensOn(allowance.opensOn)}.
        </p>
      ) : (
        <MemberQuestionForm />
      )}
    </section>
  );
}

function ManageBilling() {
  return (
    <form action="/api/membership/portal" method="POST">
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-6 py-3 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
      >
        Manage billing
      </button>
    </form>
  );
}

/**
 * Stripe's portal login page, for managing the membership (or a monthly gift)
 * from any device, beside the "Manage billing" button, which opens it directly.
 */
function PortalLoginLink() {
  return (
    <p className="mt-4 text-sm">
      <a href={STRIPE_PORTAL_LOGIN_URL} className="text-gold-text underline underline-offset-4 hover:text-navy">
        {PORTAL_LABEL}
      </a>
    </p>
  );
}

/** For a member who has also bought Following Jesus, which lives outside the membership. */
function FollowingJesusLink() {
  return (
    <div className="mt-10 rounded-xl border border-line bg-sand px-5 py-5">
      <p className="text-navy">You also have Following Jesus courses</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Bought separately from the membership, and kept in their own place.
      </p>
      <Link
        href={SERIES_PATH}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
      >
        Go to your Following Jesus courses
      </Link>
    </div>
  );
}

export default async function Members() {
  const email = await getSessionEmail();

  // Not signed in at all — nothing here to explain yet.
  if (!email) redirect("/membership");

  const member = await getMemberByEmail(email);

  // Following Jesus is bought separately, and its buyers sign in through the
  // same form. Someone with no membership at all but a Following Jesus course
  // goes to their courses; anyone with both gets a link to them below
  // (Richmond, 8 October 2026). Read through their own session, as always.
  const ownsFollowingJesus = (await getOwnedOffers()).size > 0;
  if (!member && ownsFollowingJesus) redirect(SERIES_PATH);

  // Signed in, but this address has no live membership. Say so plainly: a
  // silent bounce to /membership would look like the payment never worked.
  if (!isActive(member)) {
    return (
      <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
        <h1
          className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {needsBilling(member) ? "Your payment did not go through" : "No membership on this email"}
        </h1>

        <p
          className="mt-6 text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          You are signed in as{" "}
          <span className="break-words text-navy">{email}</span>.{" "}
          {needsBilling(member)
            ? "Update your card and the membership will pick up where it left off."
            : "There is no active membership attached to this address. If you paid with a different one, sign out and sign back in with that address."}
        </p>

        {ownsFollowingJesus && <FollowingJesusLink />}

        {/* What they wrote outlives the subscription. Only offered to someone
            who actually has a members row — a signed-in stranger has no
            journal, and requireMemberRow would turn them straight back. */}
        {member && (
          <div className="mt-10 rounded-xl border border-line bg-sand px-5 py-5">
            <p className="text-navy">Your journal stays yours</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Everything you wrote through the course is still here to read and
              to download, whether or not the membership is active.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href="/members/journal"
                className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
              >
                Read your journal
              </Link>
              <JournalButton />
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {member?.stripe_customer_id ? (
            <ManageBilling />
          ) : (
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
            >
              See the membership
            </Link>
          )}
          <form action={memberLogout}>
            <button
              type="submit"
              className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-gold-text"
            >
              Sign out
            </button>
          </form>
        </div>
        {member?.stripe_customer_id && <PortalLoginLink />}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
        Members
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Welcome to Faithful Path
      </h1>

      <div className="mt-6 space-y-4">
        {WELCOME.map((paragraph) => (
          <p
            key={paragraph.slice(0, 24)}
            className="text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {ownsFollowingJesus && <FollowingJesusLink />}

      {/* The five courses, presented alike. None is the main one: a member
          may have come for any of them, and the membership includes all. */}
      <section className="mt-12">
        <h2 className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
          Your courses
        </h2>
        <div className="mt-4 space-y-6">
          <NewEditionCard />
          <MindCourseCard />
          <BysyNewEditionCard />
          <TbymNewEditionCard />
          {LBYR_NEW_LIVE && <LbyrNewEditionCard />}
          {/* The September edition, until retired (lib/lbyr-new-live.ts). */}
          {LBYR_PUBLISHED && !(LBYR_NEW_LIVE && LBYR_OLD_RETIRED) && <LbyrCourseCard />}
        </div>
      </section>

      {member?.cancel_at_period_end && member.current_period_end && (
        <p className="mt-8 rounded-xl border border-line bg-sand px-5 py-4 text-sm leading-relaxed text-muted">
          Your membership is set to end on{" "}
          {new Date(member.current_period_end).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })}
          . You keep access until then.
        </p>
      )}

      <section className="mt-12 border-t border-line pt-10">
        <h2
          className="text-2xl text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Your journal
        </h2>
        <p className="mt-3 leading-relaxed">
          Every reflection and next step you have written, kept together. It is
          yours to keep, and it stays readable if your membership ever ends.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/members/journal"
            className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-7 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
          >
            Read your journal
          </Link>
          <JournalButton />
        </div>
      </section>

      <QuestionSection />

      <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-line pt-10">
        <ManageBilling />
        <form action={memberLogout}>
          <button
            type="submit"
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-gold-text"
          >
            Sign out
          </button>
        </form>
      </div>
      <PortalLoginLink />

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Signed in as <span className="break-words">{email}</span>.
      </p>
    </main>
  );
}
