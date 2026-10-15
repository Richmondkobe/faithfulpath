import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
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
import CourseFooter from "@/components/course/CourseFooter";
import CertificateButton from "@/components/course/CertificateButton";
import ResetSimpleOverview from "@/components/reset/ResetSimpleOverview";
import { RESET_SIMPLE_PUBLISHED, RESET_SLUG } from "@/lib/reset-simple-links";
import JournalButton from "@/components/course/JournalButton";
import { RESET_NEW_LIVE, RESET_OLD_RETIRED } from "@/lib/reset-new-live";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import NewEditionNotice from "@/components/reset-new/NewEditionNotice";

export const metadata: Metadata = {
  title: "Course | Faithful Path Community",
  robots: { index: false, follow: false },
};

export default async function CourseOverview({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  await requireActiveMember();

  const { courseSlug } = await params;
  // The previous edition, once retired, sends its visitors to the new edition.
  if (courseSlug === RESET_SLUG && RESET_NEW_LIVE && RESET_OLD_RETIRED) redirect(RESET_NEW_PATH);
  const course = getCourse(courseSlug);
  if (!course) notFound();

  // The Reset's simple layer, once it is published, is the way into that
  // course: its own overview, its own parts, and progress measured against the
  // retreat the learner chose. Guarded on the course and on the flag, so while
  // the flag is off this page behaves exactly as it always has, and the other
  // two courses never reach it at all.
  // Once the new edition is switched on, this course's overview carries one line pointing to it.
  const notice = courseSlug === RESET_SLUG && RESET_NEW_LIVE ? <NewEditionNotice /> : null;
  if (courseSlug === RESET_SLUG && RESET_SIMPLE_PUBLISHED) {
    return (
      <>
        {notice}
        <ResetSimpleOverview />
      </>
    );
  }

  const lessons = getLessons(courseSlug);
  // Reference lessons are listed and readable, but there is nothing to finish
  // in them, so they are outside both the count and the Continue trail.
  const countable = getCountableLessons(courseSlug);
  const finalLesson = lessons[lessons.length - 1];
  const [progress, route, completion] = await Promise.all([
    getCourseProgress(courseSlug),
    getRoute(courseSlug),
    getCompletion(courseSlug, finalLesson.slug),
  ]);
  const done = completedCount(progress, countable);

  const started = progress.size > 0 || route !== null;
  const nextLesson = nextLessonFor(courseSlug, lessons, countable, progress, route);

  return (
    <>
    {notice}
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href="/members"
        className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium"
      >
        ← Members
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {course.title}
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {course.description}
      </p>

      {completion.complete && (
        <div className="mt-8 rounded-xl border border-gold-text bg-sand px-5 py-5 text-navy">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
            Course complete
          </p>
          <p className="mt-1">
            You finished your Day 30 review. The lessons stay open to you.
          </p>
          <CertificateButton
            courseSlug={courseSlug}
            name={completion.name}
            nameFieldHref={`${lessonHref(courseSlug, finalLesson.slug)}#certificate-name`}
            className="mt-5"
          />
        </div>
      )}

      <div className="mt-10 rounded-xl border border-line bg-sand px-5 py-5">
        <ProgressBar done={done} total={countable.length} label="Your progress" />
        <Link
          href={lessonHref(courseSlug, nextLesson.slug)}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          {!started
            ? "Start the course"
            : done === countable.length
              ? "Revisit the last lesson"
              : "Continue"}
        </Link>
      </div>

      <div className="mt-14 space-y-12">
        {course.modules.map((mod, mi) => (
          <section key={mod.slug}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
              Module {mi + 1}
            </p>
            <h2
              className="mt-2 text-2xl text-navy"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {mod.title}
            </h2>

            <ul className="mt-5 divide-y divide-line border-y border-line">
              {mod.lessons.map((lesson) => {
                const complete = Boolean(progress.get(lesson.slug)?.completed_at);
                return (
                  <li key={lesson.slug}>
                    <Link
                      href={lessonHref(courseSlug, lesson.slug)}
                      className="group flex items-start gap-4 py-4 transition-colors hover:bg-sand"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1 w-5 shrink-0 text-center text-sm ${
                          complete ? "text-navy" : "text-muted"
                        }`}
                      >
                        {complete ? "✓" : "○"}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-navy transition-colors group-hover:text-gold-text">
                          {lesson.order}. {lesson.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">
                          {lesson.source}
                          {complete && (
                            <span className="sr-only"> — complete</span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t border-line pt-10">
        <h2
          className="text-2xl text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Your journal
        </h2>
        <p className="mt-3 leading-relaxed">
          Everything you have written through these lessons, gathered in one
          place — yours to read here or to take away as a PDF.
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

      <CourseFooter courseSlug={courseSlug} />
    </main>
    </>
  );
}
