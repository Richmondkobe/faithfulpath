import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  getCourseComplete,
  getRoute,
  nextLessonFor,
} from "@/lib/course-progress";
import ProgressBar from "@/components/course/ProgressBar";
import CourseFooter from "@/components/course/CourseFooter";

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
  const course = getCourse(courseSlug);
  if (!course) notFound();

  const lessons = getLessons(courseSlug);
  // Reference lessons are listed and readable, but there is nothing to finish
  // in them, so they are outside both the count and the Continue trail.
  const countable = getCountableLessons(courseSlug);
  const finalLesson = lessons[lessons.length - 1];
  const [progress, route, courseComplete] = await Promise.all([
    getCourseProgress(courseSlug),
    getRoute(courseSlug),
    getCourseComplete(courseSlug, finalLesson.slug),
  ]);
  const done = completedCount(progress, countable);

  const started = progress.size > 0 || route !== null;
  const nextLesson = nextLessonFor(courseSlug, lessons, countable, progress, route);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href="/members"
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← Members
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {course.title}
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        {course.description}
      </p>

      {courseComplete && (
        <p className="mt-8 rounded-sm border border-[#8B5E34] bg-[#F3EADC] px-5 py-4 text-[#2B2118]">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            Course complete
          </span>
          <span className="mt-1 block">
            You finished your Day 30 review. The lessons stay open to you.
          </span>
        </p>
      )}

      <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
        <ProgressBar done={done} total={countable.length} label="Your progress" />
        <Link
          href={lessonHref(courseSlug, nextLesson.slug)}
          className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              Module {mi + 1}
            </p>
            <h2
              className="mt-2 text-2xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {mod.title}
            </h2>

            <ul className="mt-5 divide-y divide-[#E5D9C7] border-y border-[#E5D9C7]">
              {mod.lessons.map((lesson) => {
                const complete = Boolean(progress.get(lesson.slug)?.completed_at);
                return (
                  <li key={lesson.slug}>
                    <Link
                      href={lessonHref(courseSlug, lesson.slug)}
                      className="group flex items-start gap-4 py-4 transition-colors hover:bg-[#F7F1E6]"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1 w-5 shrink-0 text-center text-sm ${
                          complete ? "text-[#2C5651]" : "text-[#C6B9A6]"
                        }`}
                      >
                        {complete ? "✓" : "○"}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[#2B2118] transition-colors group-hover:text-[#8B5E34]">
                          {lesson.order}. {lesson.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-[#6B5F53]">
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

      <CourseFooter courseSlug={courseSlug} />
    </main>
  );
}
