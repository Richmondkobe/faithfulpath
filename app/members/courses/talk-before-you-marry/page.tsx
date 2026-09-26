import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import {
  getTbymCourse,
  tbymLessonHref,
  tbymFacilitatorHref,
  tbymSafetyHref,
  tbymStartHereHref,
  TBYM_SLUG,
} from "@/lib/tbym-course";
import TbymFooter from "@/components/tbym/TbymFooter";

export const metadata: Metadata = {
  title: "Talk Before You Marry | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The course overview.
 *
 * The hub: Start Here, the fourteen lessons in order, and the two pages that
 * sit beside them — Safety and Support, and the Facilitator Guide.
 */
export default async function TbymCourseHome() {
  await requireActiveMember();

  const course = getTbymCourse();
  const progress = await getCourseProgress(TBYM_SLUG);
  const doneCount = [...progress.values()].filter((p) => p.completed_at).length;

  return (
    <>
    <main
      className="mx-auto max-w-[760px] px-4 pt-8 pb-14"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Link
        href="/members"
        className="text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)] underline underline-offset-4"
        style={{ fontFamily: "var(--font-tbym-mono)" }}
      >
        ← Your courses
      </Link>

      <h1
        className="mt-5 text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[var(--tb-ink)]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {course.title}
      </h1>
      <p className="mt-3 text-[1.05rem] leading-relaxed text-[var(--tb-mute)]">
        {course.description}
      </p>

      <div
        className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--tb-track)]"
        role="img"
        aria-label={`${doneCount} of ${course.lesson_count} lessons complete`}
      >
        <span
          className="block h-full bg-[var(--tb-accent)]"
          style={{ width: `${(doneCount / course.lesson_count) * 100}%` }}
        />
      </div>
      <p
        className="mt-3 text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)]"
        style={{ fontFamily: "var(--font-tbym-mono)" }}
      >
        {doneCount} of {course.lesson_count} lessons complete
      </p>

      <p className="mt-8">
        <Link
          href={tbymStartHereHref}
          className="inline-flex items-center justify-center rounded-md bg-[var(--tb-btn)] px-7 py-4 text-[17px] font-medium text-[var(--tb-btn-ink)]"
        >
          Start Here: Before You Begin
        </Link>
      </p>

      <ul className="mt-8 space-y-3">
        {course.lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={tbymLessonHref(lesson.slug)}
              className="flex flex-wrap items-baseline gap-x-3 rounded-md border border-[var(--tb-line)] bg-[var(--tb-card)] px-5 py-4 text-[var(--tb-ink)]"
            >
              <span
                className="text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)]"
                style={{ fontFamily: "var(--font-tbym-mono)" }}
              >
                Lesson {lesson.order}
              </span>
              <span className="text-[1.05rem]">{lesson.title}</span>
              {progress.get(lesson.slug)?.completed_at && (
                <span
                  className="ml-auto text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)]"
                  style={{ fontFamily: "var(--font-tbym-mono)" }}
                >
                  Complete
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
        <Link
          href={tbymSafetyHref}
          className="text-[var(--tb-accent)] underline underline-offset-4"
        >
          Safety and Support
        </Link>
        <Link
          href={tbymFacilitatorHref}
          className="text-[var(--tb-accent)] underline underline-offset-4"
        >
          Facilitator Guide
        </Link>
      </p>
    </main>

    <TbymFooter variant="full" />
    </>
  );
}
