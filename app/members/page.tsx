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
  getCourseComplete,
  getRoute,
  nextLessonFor,
} from "@/lib/course-progress";
import ProgressBar from "@/components/course/ProgressBar";

const COURSE_SLUG = "christian-spiritual-reset";

const WELCOME = [
  "You are in the right place.",
  "Everything here moves at a pace you can safely manage. There are no grades, deadlines, or rewards for finishing quickly. You may shorten an exercise, pause a session, or return to the retreat later.",
  "Begin with the welcome, then choose the route that matches the capacity you have today.",
  "If you are already exhausted, choose the Quick Start route. Complete the essential safety and preparation steps, then begin with a shorter reset.",
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
  let courseComplete = false;
  try {
    progress = await getCourseProgress(COURSE_SLUG);
    route = await getRoute(COURSE_SLUG);
    courseComplete = await getCourseComplete(
      COURSE_SLUG,
      lessons[lessons.length - 1].slug
    );
  } catch (err) {
    console.error("Course card hidden — could not read progress:", err);
    return null;
  }

  const done = completedCount(progress, countable);
  const next = nextLessonFor(COURSE_SLUG, lessons, countable, progress, route);

  return (
    <section className="mt-12 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Your course
      </p>
      <h2
        className="mt-2 text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {course.title}
      </h2>

      {courseComplete && (
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Course complete
        </p>
      )}

      <div className="mt-5">
        <ProgressBar done={done} total={countable.length} label="Your progress" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link
          href={`/members/courses/${COURSE_SLUG}`}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {progress.size === 0 && route === null
            ? "Start the course"
            : "Go to the course"}
        </Link>
        {done > 0 && done < countable.length && (
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

      <CourseCard />

      {member?.cancel_at_period_end && member.current_period_end && (
        <p className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 text-sm leading-relaxed text-[#6B5F53]">
          Your membership is set to end on{" "}
          {new Date(member.current_period_end).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })}
          . You keep access until then.
        </p>
      )}

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
