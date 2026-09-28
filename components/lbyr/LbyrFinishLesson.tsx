"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { setLessonComplete } from "@/app/members/courses/actions";
import { LBYR_SLUG } from "@/lib/lbyr-links";
import { Inlines } from "@/components/lbyr/Blocks";
import type { Inline } from "@/lib/lbyr-html";

/**
 * "Ready to finish for today?", in the order the preview pages fix.
 *
 * Only pressing Finish records anything, and it records one thing: this lesson,
 * for this member, through the same setLessonComplete every other course uses.
 * Nothing watches the scroll position and nothing watches the recording.
 *
 * Afterwards the page shows what it showed in the preview — the lesson marked
 * finished, the week's step restated, and the way on to the next lesson.
 * "Stop here for today" is a door in both states and records nothing on the way
 * out. "Mark it unfinished" undoes it.
 *
 * The progress bar above is server-rendered from the saved count, so it is
 * updated by the refresh this transition triggers rather than by a second copy
 * of the count kept here.
 */
export default function LbyrFinishLesson({
  lessonSlug,
  lessonOrder,
  finished,
  weekStep,
  nextLabel,
  nextHref,
  overviewHref,
}: {
  lessonSlug: string;
  lessonOrder: number;
  finished: boolean;
  /** The one-line reminder of this week's action. */
  weekStep: Inline[];
  /** "Lesson 2: Leading Yourself First", or the finish page on Lesson 10. */
  nextLabel: string | null;
  nextHref: string;
  overviewHref: string;
}) {
  const [done, setDone] = useState(finished);
  const [pending, start] = useTransition();

  const mark = (value: boolean) =>
    start(async () => {
      await setLessonComplete(LBYR_SLUG, lessonSlug, value);
      setDone(value);
    });

  const stopHere = (
    <div className="mt-3">
      <Link
        href={overviewHref}
        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
      >
        Stop here for today
      </Link>
    </div>
  );

  return (
    <>
      {!done ? (
        <>
          <button
            type="button"
            onClick={() => mark(true)}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Saving…" : `Finish Lesson ${lessonOrder}`}
          </button>
          {stopHere}
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B5F53]">
            Your course progress is saved automatically.
          </p>
        </>
      ) : (
        <>
          <p
            className="text-[19px] leading-snug text-[#2B2118]"
            role="status"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lesson {lessonOrder} finished
          </p>
          <p className="mt-2 text-[18px] leading-relaxed">
            <Inlines nodes={weekStep} />
          </p>

          {nextLabel && (
            <div className="mt-5">
              <Link
                href={nextHref}
                className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
              >
                Continue to {nextLabel}
              </Link>
            </div>
          )}
          {stopHere}
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B5F53]">
            Your course progress is saved automatically.{" "}
            <button
              type="button"
              onClick={() => mark(false)}
              disabled={pending}
              className="underline underline-offset-4 disabled:opacity-60"
            >
              Mark it unfinished
            </button>
          </p>
        </>
      )}
    </>
  );
}
