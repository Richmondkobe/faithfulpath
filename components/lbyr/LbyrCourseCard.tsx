import Link from "next/link";

import ProgressBar from "@/components/course/ProgressBar";
import { getCourseProgress } from "@/lib/course-progress";
import { LBYR_BASE, LBYR_LESSON_COUNT, LBYR_SLUG } from "@/lib/lbyr-links";

/**
 * Lead Before You're Ready, on the members page.
 *
 * Presented as the other cards are, for the same reason they are presented
 * alike: none of them is the secondary one. Rendered only behind
 * LBYR_PUBLISHED, which is where the course is taken down if it needs to be.
 *
 * The button goes to the course entry rather than to Start Here, so a
 * returning member lands on their next unfinished lesson instead of walking
 * past the welcome page every time.
 *
 * Like the other cards, an unreadable table hides the card rather than
 * breaking /members.
 */
export default async function LbyrCourseCard() {
  let doneCount = 0;
  try {
    const progress = await getCourseProgress(LBYR_SLUG);
    doneCount = [...progress.values()].filter((p) => p.completed_at).length;
  } catch (err) {
    console.error("Lead Before You're Ready card hidden — could not read progress:", err);
    return null;
  }

  return (
    <section className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Lead Before You’re Ready
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
        Practical pastoral training for your first year or two of leading in a
        church.
      </p>

      <div className="mt-5">
        <ProgressBar
          done={doneCount}
          total={LBYR_LESSON_COUNT}
          label="Your progress"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link
          href={LBYR_BASE}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {doneCount > 0 ? "Go to the course" : "Start the course"}
        </Link>
      </div>
    </section>
  );
}
