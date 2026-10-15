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
    <section className="rounded-2xl border border-line bg-paper px-5 py-5">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Lead Before You’re Ready
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
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
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          {doneCount > 0 ? "Go to the course" : "Start the course"}
        </Link>
      </div>
    </section>
  );
}
