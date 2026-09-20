import Link from "next/link";
import { getPages, readCourseHome } from "@/lib/bysy-course";
import { SIMPLE_PAGES } from "@/lib/bysy-simple";
import { getStoredRoute } from "@/lib/bysy-progress";
import { BYSY_BASE } from "@/lib/bysy-links";
import { BYSY_SIMPLE_PUBLISHED, simpleHref } from "@/lib/bysy-simple-links";

/**
 * Before You Say Yes, on the members page.
 *
 * Presented as the other two cards are, for the reason the other two are
 * presented alike: none of them is the secondary one.
 *
 * What it does not show is a progress bar. The other courses have one sequence
 * each, so a bar means something; this course has five routes of different
 * lengths, and a learner on the thirteen-page route is not behind a learner on
 * the thirty-five-page one. A bar would invent a target where the course has
 * deliberately refused to set one, and it would do it on the members page,
 * where the learner sees it before they have chosen anything.
 *
 * It does not name the route either, though it knows it. The route labels
 * describe the learner's situation — already engaged, in a relationship they
 * have concerns about — and /members is the page a member may open in front of
 * somebody. The route is stored as an opaque id precisely so the label is not
 * written down; printing it on the landing page would give back what that was
 * protecting. The card knows only whether to say start or continue.
 *
 * Like the other cards, an unreadable table hides the card rather than breaking
 * /members.
 */
export default async function BysyCourseCard() {
  if (!readCourseHome()) return null;

  let route: string | null = null;
  try {
    route = await getStoredRoute();
  } catch (err) {
    console.error("Before You Say Yes card hidden — could not read progress:", err);
    return null;
  }

  return (
    <section className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Before You Say Yes
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
        Discernment for dating, courtship and the decision to marry — whether
        you are considering someone, already engaged, or working out whether to
        begin.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link
          href={route || !BYSY_SIMPLE_PUBLISHED ? BYSY_BASE : simpleHref("welcome")}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {route ? "Go to the course" : "Start the course"}
        </Link>
        <span className="text-sm text-[#6B5F53]">
          {BYSY_SIMPLE_PUBLISHED ? SIMPLE_PAGES.length : getPages().length} pages
          · you will be shown a shorter way through
        </span>
      </div>
    </section>
  );
}
