import Link from "next/link";

import ProgressBar from "@/components/course/ProgressBar";
import { getCourseProgress } from "@/lib/course-progress";
import { getResetPlan } from "@/app/members/courses/christian-spiritual-reset/actions";
import {
  PART,
  pagesInPart,
  resetParts,
  resetRouteProgress,
  routeFinished,
  sessionInPlan,
  sessionProgressSlug,
} from "@/lib/reset-simple";
import { RESET_SLUG, resetSimpleHref } from "@/lib/reset-simple-links";

/**
 * The Reset's course home, once the simple layer is published.
 *
 * The 38-page course is not gone: every page of it stays where it is and
 * becomes the Go Deeper Library each simple lesson links to at its foot. This
 * is the way in, not a replacement for the material.
 *
 * The list shows the part a page belongs to rather than a flat thirty-three,
 * because the parts are how the course describes itself and because thirty-
 * three is a number that makes somebody tired before they begin.
 *
 * A session the learner's retreat does not contain is shown greyed rather than
 * hidden. Hiding it would make the course look shorter than it is and leave
 * them wondering what the numbers skipped; greyed says plainly that a longer
 * retreat contains more, and nothing is locked.
 */
export default async function ResetSimpleOverview() {
  const [progress, plan] = await Promise.all([
    getCourseProgress(RESET_SLUG),
    getResetPlan(),
  ]);

  const isDone = (slug: string) => Boolean(progress.get(slug)?.completed_at);
  const { done, total } = resetRouteProgress(plan, isDone);
  const finish = routeFinished(plan, isDone);
  const started = progress.size > 0 || plan !== null;

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
        The Christian Spiritual Reset
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[#4A4038]">
        A guided retreat you listen to: prepare, take your retreat, and bring it
        home. Every lesson is a short recording with the words underneath, and
        the full teaching stays in the Go Deeper Library.
      </p>

      {finish.finished && (
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Course complete
        </p>
      )}

      {/* Measured against the learner's own retreat, not the longest one. */}
      <div className="mt-8">
        <ProgressBar done={done} total={total} label="Your progress" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <Link
          href={resetSimpleHref(started && finish.next ? finish.next : "welcome")}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {started ? "Continue the course" : "Start the course"}
        </Link>
        <Link
          href={resetSimpleHref("safety-and-support")}
          className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Safety and support
        </Link>
      </div>

      {resetParts().map((part) => {
        const pages = pagesInPart(part);
        return (
          <section key={part} className="mt-10">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              {part}
            </h2>
            <ul className="mt-3 space-y-1">
              {pages.map((p) => {
                const slug = p.slug.startsWith("session-")
                  ? sessionProgressSlug(p.slug, plan)
                  : p.slug;
                const finished = isDone(slug);
                const included = p.slug.startsWith("session-")
                  ? sessionInPlan(p.slug, plan)
                  : true;
                return (
                  <li key={p.slug} className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className={`text-sm ${finished ? "text-[#8B5E34]" : "text-[#D9CDBA]"}`}
                    >
                      {finished ? "✓" : "·"}
                    </span>
                    <Link
                      href={resetSimpleHref(p.slug)}
                      className={`text-[15px] leading-relaxed underline-offset-4 transition-colors hover:underline ${
                        included ? "text-[#2B2118]" : "text-[#8B8177]"
                      }`}
                    >
                      {p.title}
                    </Link>
                    {!included && (
                      <span className="text-xs text-[#8B8177]">
                        in a longer retreat
                      </span>
                    )}
                    {p.part === PART.followup && (
                      <span className="text-xs text-[#8B8177]">
                        best after 30 days
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
