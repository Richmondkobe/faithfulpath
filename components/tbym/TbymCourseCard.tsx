import Link from "next/link";

import ProgressBar from "@/components/course/ProgressBar";
import { getCourseProgress } from "@/lib/course-progress";
import { getTbymCourse, TBYM_BASE, TBYM_SLUG } from "@/lib/tbym-course";
import { TBYM_NEW_LIVE } from "@/lib/tbym-new-live";

/**
 * Talk Before You Marry, on the members page.
 *
 * Presented as the other cards are, for the same reason they are presented
 * alike: none of them is the secondary one. The card is rendered only behind
 * TBYM_PUBLISHED, which is where the course is taken down if it needs to be.
 *
 * The progress bar counts against all fourteen lessons rather than against the
 * lessons that happen to be written, so it never reads as complete on a course
 * that is not.
 *
 * Like the other cards, an unreadable table hides the card rather than breaking
 * /members.
 */
export default async function TbymCourseCard() {
  const course = getTbymCourse();

  let doneCount = 0;
  try {
    const progress = await getCourseProgress(TBYM_SLUG);
    doneCount = [...progress.values()].filter((p) => p.completed_at).length;
  } catch (err) {
    console.error("Talk Before You Marry card hidden — could not read progress:", err);
    return null;
  }

  return (
    <section className="rounded-2xl border border-line bg-paper px-5 py-5">
      {TBYM_NEW_LIVE && (
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">Previous edition</p>
      )}
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {course.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        {course.description}
      </p>

      <div className="mt-5">
        <ProgressBar
          done={doneCount}
          total={course.lesson_count}
          label="Your progress"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link
          href={TBYM_BASE}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          {doneCount > 0 ? "Go to the course" : "Start the course"}
        </Link>
      </div>
    </section>
  );
}
