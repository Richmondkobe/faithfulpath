import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import { getMindCourse, getCountingLessons } from "@/lib/mind-course";
import { getFinishedLessons } from "@/lib/mind-progress";
import { mindLessonHref, slugFromFile, MIND_BASE } from "@/lib/mind-links";

export const metadata: Metadata = {
  title: "When Your Mind Won't Rest | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * What the course is, before the first lesson.
 *
 * Deliberately short. It exists so that "Start the Course" does not drop
 * somebody into Lesson 1 with no idea how long the road is — not to be another
 * page of instructions to get past. Everything practical the old orientation
 * module said is still there under Start Here; this says the three things
 * somebody needs before they begin, and then gets out of the way.
 *
 * A member who has already finished lessons is offered the next one rather
 * than sent back to the first.
 */
export default async function MindCourseStart() {
  await requireActiveMember();

  const course = getMindCourse();
  const lessons = getCountingLessons();
  const finished = await getFinishedLessons();

  // The modules the lessons actually sit in, counted from the manifest rather
  // than written down, so it follows if a module is ever added.
  const modules = course.modules.filter((m) => m.counts_towards_completion).length;
  const doneCount = lessons.filter(
    (l) => finished.get(slugFromFile(l.file))?.finished
  ).length;

  // Where the button goes: the first lesson they have not finished, or the
  // first lesson if they have not started.
  const nextLesson = lessons.find((l) => !finished.get(slugFromFile(l.file))?.finished)
    ?? lessons[0];
  const started = doneCount > 0;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href={MIND_BASE}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← {course.title}
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[2.75rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Before you begin
      </h1>

      <div className="mt-6 space-y-4 text-lg leading-relaxed text-[#4A4038]">
        <p>
          This course teaches one skill at a time: how to notice when your
          thinking has started circling, what is usually underneath it, and what
          to do with a mind that will not settle — in prayer, in Scripture, and
          in the ordinary care of your body and your days.
        </p>
        <p>
          There are {modules} modules and {lessons.length} lessons. Each lesson
          is a short talk you watch or listen to, about eight to ten minutes,
          with one small practice at the end. Nothing is timed, scored or
          marked, and nothing is locked — you may stop anywhere and come back.
        </p>
      </div>

      <p className="mt-8">
        <Link
          href={mindLessonHref(slugFromFile(nextLesson.file))}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {started ? `Continue: ${nextLesson.title}` : "Start Lesson 1"}
        </Link>
      </p>

      {started && (
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          {doneCount} of {lessons.length} lessons finished
        </p>
      )}
    </main>
  );
}
