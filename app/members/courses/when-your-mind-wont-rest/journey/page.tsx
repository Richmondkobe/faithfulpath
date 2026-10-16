import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  getJourneyModule,
  getJourneyWeeks,
  readPageFile,
  splitFirstNotice,
} from "@/lib/mind-course";
import { getJourneyProgress, visitedWording } from "@/lib/mind-progress";
import { DAY_STATUS_LABELS } from "@/lib/mind-types";
import { MIND_BASE, mindDayHref } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";

export const metadata: Metadata = {
  title: "The 30-Day Mind-Renewal Journey",
  robots: { index: false, follow: false },
};

/**
 * The journey home.
 *
 * On a member's first entry — no day opened yet — the "Please read before Day
 * 1" notice is shown on its own, with a single Continue to Day 1 button. There
 * is no checkbox, no agreement and nothing stored: the manifest forbids all
 * three, so first entry is inferred from the absence of any day row rather than
 * from a record of having seen it. The notice stays reachable afterwards.
 *
 * Progress is a count of days visited and nothing else. No streaks, no overdue
 * days, no catching up, and nothing scored — a member who opened four days in
 * March and comes back in August has not fallen behind anything.
 */
export default async function JourneyHome() {
  await requireActiveMember();

  const journey = getJourneyModule();
  const file = readPageFile(journey.home ?? "m5/00-journey-home.md");
  if (!file) notFound();

  const { notice, rest } = splitFirstNotice(file.body);
  const progress = await getJourneyProgress();
  const firstEntry = progress.size === 0;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
      <Link href={MIND_BASE} className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
        ← When Your Mind Won&rsquo;t Rest
      </Link>

      {firstEntry ? (
        <>
          <h1
            className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {journey.title}
          </h1>

          {notice && (
            <div className="mt-8 rounded-xl border border-line bg-sand px-5 py-5">
              <MindMarkdown source={notice} />
            </div>
          )}

          {/* One button, and no checkbox. */}
          <Link
            href={mindDayHref(1)}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            Continue to Day 1
          </Link>
        </>
      ) : (
        <>
          <h1
            className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {journey.title}
          </h1>

          <p className="mt-5 text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
            {visitedWording(progress)}
          </p>

          {notice && (
            <details className="group mt-8 rounded-xl border border-line bg-sand px-5 py-4">
              <summary className="cursor-pointer list-none text-sm text-gold-text">
                Please read before Day 1
              </summary>
              <div className="mt-2 border-t border-line pt-2">
                <MindMarkdown source={notice} />
              </div>
            </details>
          )}

          <article className="mt-6">
            <MindMarkdown source={rest} />
          </article>

          <div className="mt-12 space-y-10">
            {getJourneyWeeks().map((week) => (
              <section key={week.week}>
                <h2 className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
                  {week.title}
                </h2>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {week.days.map((day) => {
                    const state = progress.get(day.day!);
                    return (
                      <li key={day.day}>
                        <Link
                          href={mindDayHref(day.day!)}
                          className="group flex items-baseline justify-between gap-4 py-4 transition-colors hover:bg-sand"
                        >
                          <span className="min-w-0 text-navy transition-colors group-hover:text-gold-text">
                            {day.title}
                          </span>
                          <span className="shrink-0 text-sm text-muted">
                            {state?.status
                              ? DAY_STATUS_LABELS[state.status]
                              : state
                                ? "Visited"
                                : ""}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
