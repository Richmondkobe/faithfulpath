import Link from "next/link";
import { getMindCourse, getCountingLessons } from "@/lib/mind-course";
import {
  getFinishedLessons,
  getJourneyProgress,
  visitedWording,
} from "@/lib/mind-progress";
import { MIND_BASE, slugFromFile } from "@/lib/mind-links";

/**
 * The second course, on the members page.
 *
 * It shows where the member has been and nothing about where they should be.
 * The two progress lines are separate because the course keeps them separate:
 * finishing the twenty-one lessons is what the certificate counts, and the
 * journey is thirty days visited at whatever pace. Neither is a target, and
 * there is nothing here to fall behind on.
 *
 * Like the Spiritual Reset's card, an unreadable table hides the card rather
 * than breaking /members — a member's landing page must survive a bad query.
 */
export default async function MindCourseCard() {
  const course = getMindCourse();
  const lessons = getCountingLessons();

  let finished;
  let journey;
  try {
    [finished, journey] = await Promise.all([
      getFinishedLessons(),
      getJourneyProgress(),
    ]);
  } catch (err) {
    console.error("Mind course card hidden — could not read progress:", err);
    return null;
  }

  const done = lessons.filter((l) => finished.get(slugFromFile(l.file))?.finished).length;
  const started = done > 0 || journey.size > 0;

  return (
    <section className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Also in your membership
      </p>
      <h2
        className="mt-2 text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {course.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
        {course.subtitle}
      </p>

      {started && (
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          {done > 0 && `${done} of ${lessons.length} lessons finished`}
          {done > 0 && journey.size > 0 && " · "}
          {journey.size > 0 && visitedWording(journey)}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link
          href={MIND_BASE}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {started ? "Go to the course" : "Start the course"}
        </Link>
        {/* The page a member reaches when they need somewhere to begin now,
            offered here so it is one tap from the members page too. */}
        <Link
          href={`${MIND_BASE}/lessons/07-my-mind-is-restless-right-now`}
          className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          My mind is restless right now
        </Link>
      </div>
    </section>
  );
}
