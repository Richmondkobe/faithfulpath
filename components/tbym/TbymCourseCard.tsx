import Link from "next/link";

import ProgressBar from "@/components/course/ProgressBar";
import { getCourseProgress } from "@/lib/course-progress";
import { getTbymCourse, TBYM_BASE, TBYM_SLUG } from "@/lib/tbym-course";

/**
 * Talk Before You Marry, on the members page.
 *
 * Presented as the other cards are, for the same reason they are presented
 * alike: none of them is the secondary one. The card is rendered only behind
 * TBYM_PUBLISHED, which is off while the course is one lesson of fourteen.
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
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {doneCount > 0 ? "Go to the course" : "Start the course"}
        </Link>
      </div>
    </section>
  );
}
