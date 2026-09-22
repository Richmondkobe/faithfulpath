import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive, needsBilling } from "@/lib/members";
import { memberLogout } from "@/app/members/actions";
import {
  getCountableLessons,
  getCourse,
  getLessons,
  lessonHref,
} from "@/lib/course";
import {
  getCourseProgress,
  completedCount,
  getCompletion,
  getRoute,
  nextLessonFor,
} from "@/lib/course-progress";
import ProgressBar from "@/components/course/ProgressBar";
import CertificateButton from "@/components/course/CertificateButton";
import JournalButton from "@/components/course/JournalButton";
import MemberQuestionForm from "@/components/MemberQuestionForm";
import MindCourseCard from "@/components/mind/MindCourseCard";
import BysyCourseCard from "@/components/bysy/BysyCourseCard";
import { getResetPlan } from "@/app/members/courses/christian-spiritual-reset/actions";
import { resetRouteProgress, routeFinished } from "@/lib/reset-simple";
import { RESET_SIMPLE_PUBLISHED, resetSimpleHref } from "@/lib/reset-simple-links";
import { BYSY_PUBLISHED } from "@/lib/bysy-links";
import { getQuestionAllowance, formatOpensOn } from "@/lib/questions";

const COURSE_SLUG = "christian-spiritual-reset";

// Written for both courses. The route chooser and Quick Start it used to name
// belong to the Spiritual Reset alone; what is said here has to be true of the
// other course as well, so the wayfinding moved to each course's own home and
// this says only what both share.
const WELCOME = [
  "You are in the right place.",
  "Everything here moves at a pace you can safely manage. There are no grades, deadlines, or rewards for finishing quickly. You may shorten an exercise, pause a session, or come back to it later.",
  "There are three courses below. Begin with any of them; none has to be finished before another is started.",
  "Each begins by asking what you have room for today, and each keeps a shorter way in for when that is very little.",
  "If your mind is restless right now, you do not have to start at the beginning. There is a page that takes you straight to the part that matches.",
  "You do not have to carry the whole course at once.",
  "The rest will be here when you are ready.",
];

export const metadata: Metadata = {
  title: "Members | Faithful Path Community",
  robots: { index: false, follow: false },
};

async function CourseCard() {
  const course = getCourse(COURSE_SLUG);
  if (!course) return null;

  const lessons = getLessons(COURSE_SLUG);
  const countable = getCountableLessons(COURSE_SLUG);

  // /members is the page a paying member lands on, so it must not break because
  // the course tables are missing or unreadable. Drop the card and log it
  // instead — the membership itself is unaffected.
  let progress;
  let route = null;
  let completion = { complete: false, name: null as string | null, finishedAt: null as string | null };
  try {
    progress = await getCourseProgress(COURSE_SLUG);
    route = await getRoute(COURSE_SLUG);
    completion = await getCompletion(
      COURSE_SLUG,
      lessons[lessons.length - 1].slug
    );
  } catch (err) {
    console.error("Course card hidden — could not read progress:", err);
    return null;
  }

  const done = completedCount(progress, countable);
  const next = nextLessonFor(COURSE_SLUG, lessons, countable, progress, route);

  // Once the simple layer is published it is what this card offers: the way in,
  // the count and the progress all come from there. The 38-page course stays
  // exactly where it is and becomes the Go Deeper Library behind it. While the
  // flag is off none of this is reached and the card is unchanged.
  let simple = null as null | {
    href: string;
    label: string;
    done: number;
    total: number;
  };
  if (RESET_SIMPLE_PUBLISHED) {
    try {
      const plan = await getResetPlan();
      const isDone = (slug: string) => Boolean(progress.get(slug)?.completed_at);
      const counted = resetRouteProgress(plan, isDone);
      const finish = routeFinished(plan, isDone);
      const started = progress.size > 0 || plan !== null;
      simple = {
        href: resetSimpleHref(started && finish.next ? finish.next : "welcome"),
        label: started ? "Go to the course" : "Start the course",
        ...counted,
      };
    } catch (err) {
      // The card falls back to the existing course rather than disappearing.
      console.error("Simple layer progress unreadable, showing the course:", err);
    }
  }

  return (
    <section className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {course.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
        {course.description}
      </p>

      {completion.complete && (
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Course complete
        </p>
      )}

      <div className="mt-5">
        <ProgressBar
          done={simple ? simple.done : done}
          total={simple ? simple.total : countable.length}
          label="Your progress"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link
          href={simple ? simple.href : `/members/courses/${COURSE_SLUG}`}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {simple
            ? simple.label
            : progress.size === 0 && route === null
              ? "Start the course"
              : "Go to the course"}
        </Link>
        {completion.complete && (
          <CertificateButton
            courseSlug={COURSE_SLUG}
            name={completion.name}
            nameFieldHref={`${lessonHref(COURSE_SLUG, lessons[lessons.length - 1].slug)}#certificate-name`}
          />
        )}
        {/* The simple layer's own button already says continue and goes to the
            right page, so a second link beside it would be the same offer
            twice under two different names. */}
        {!simple && done > 0 && done < countable.length && (
          <Link
            href={lessonHref(COURSE_SLUG, next.slug)}
            className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Continue: {next.title}
          </Link>
        )}
      </div>
    </section>
  );
}

/**
 * One written question a month. The allowance is read here and the form only
 * rendered when it is available — askMemberQuestion re-checks it anyway, since
 * a hidden form is not a control.
 */
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
    <section className="mt-12 border-t border-[#E5D9C7] pt-10">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Ask Pastor Richmond
      </h2>
      <p className="mt-3 leading-relaxed">
        One written question a month, answered personally. Take as long as you
        need to write it.
      </p>

      {allowance.used ? (
        <p className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 leading-relaxed text-[#6B5F53]">
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
        className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-6 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
      >
        Manage billing
      </button>
    </form>
  );
}

export default async function Members() {
  const email = await getSessionEmail();

  // Not signed in at all — nothing here to explain yet.
  if (!email) redirect("/membership");

  const member = await getMemberByEmail(email);

  // Signed in, but this address has no live membership. Say so plainly: a
  // silent bounce to /membership would look like the payment never worked.
  if (!isActive(member)) {
    return (
      <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
        <h1
          className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {needsBilling(member) ? "Your payment did not go through" : "No membership on this email"}
        </h1>

        <p
          className="mt-6 text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          You are signed in as{" "}
          <span className="break-words text-[#2B2118]">{email}</span>.{" "}
          {needsBilling(member)
            ? "Update your card and the membership will pick up where it left off."
            : "There is no active membership attached to this address. If you paid with a different one, sign out and sign back in with that address."}
        </p>

        {/* What they wrote outlives the subscription. Only offered to someone
            who actually has a members row — a signed-in stranger has no
            journal, and requireMemberRow would turn them straight back. */}
        {member && (
          <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
            <p className="text-[#2B2118]">Your journal stays yours</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
              Everything you wrote through the course is still here to read and
              to download, whether or not the membership is active.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href="/members/journal"
                className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
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
              className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
            >
              See the membership
            </Link>
          )}
          <form action={memberLogout}>
            <button
              type="submit"
              className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Members
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Welcome to Faithful Path
      </h1>

      <div className="mt-6 space-y-4">
        {WELCOME.map((paragraph) => (
          <p
            key={paragraph.slice(0, 24)}
            className="text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Two courses, presented alike. Neither is the main one: a member may
          have come for either, and the membership includes both. */}
      <section className="mt-12">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Your courses
        </h2>
        <div className="mt-4 space-y-6">
          <CourseCard />
          <MindCourseCard />
          {/* Built, and deliberately not reachable: the course stays unlinked
              until the pre-publish checklist has been run in full. */}
          {BYSY_PUBLISHED && <BysyCourseCard />}
        </div>
      </section>

      {member?.cancel_at_period_end && member.current_period_end && (
        <p className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 text-sm leading-relaxed text-[#6B5F53]">
          Your membership is set to end on{" "}
          {new Date(member.current_period_end).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })}
          . You keep access until then.
        </p>
      )}

      <section className="mt-12 border-t border-[#E5D9C7] pt-10">
        <h2
          className="text-2xl text-[#2B2118]"
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
            className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-7 py-4 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
          >
            Read your journal
          </Link>
          <JournalButton />
        </div>
      </section>

      <QuestionSection />

      <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-[#E5D9C7] pt-10">
        <ManageBilling />
        <form action={memberLogout}>
          <button
            type="submit"
            className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
          >
            Sign out
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-[#6B5F53]">
        Signed in as <span className="break-words">{email}</span>.
      </p>
    </main>
  );
}
