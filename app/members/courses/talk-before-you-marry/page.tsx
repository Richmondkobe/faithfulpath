import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import { getTbymCourse, tbymLessonHref, TBYM_SLUG } from "@/lib/tbym-course";

export const metadata: Metadata = {
  title: "Talk Before You Marry | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The course overview.
 *
 * Minimal on purpose: one lesson of fourteen is written, and this page exists
 * so the lesson has somewhere to come from and go back to. Start Here, Safety
 * and Support and the Facilitator Guide are separate pages in the build brief
 * and are not built yet; when they are, they belong here.
 */
export default async function TbymCourseHome() {
  await requireActiveMember();

  const course = getTbymCourse();
  const progress = await getCourseProgress(TBYM_SLUG);
  const doneCount = [...progress.values()].filter((p) => p.completed_at).length;

  return (
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

      {course.lessons.length < course.lesson_count && (
        <p
          className="mt-6 rounded-sm border border-dashed border-[var(--tb-accent)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-mute)]"
          style={{ fontFamily: "var(--font-tbym-mono)" }}
        >
          {course.lessons.length} of {course.lesson_count} lessons built. Start
          Here, Safety and Support and the Facilitator Guide are not built yet.
        </p>
      )}
    </main>
  );
}
