"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { setLessonComplete } from "@/app/members/courses/actions";

/**
 * The completion block, in the order the build brief fixes.
 *
 * "Ready to finish for today?" and one button. Only that press records
 * anything, for this learner and nobody else: it calls the same
 * setLessonComplete every other course uses, which writes one row to
 * course_progress scoped to the signed-in user. There is no scroll tracking and
 * nothing watching the end of the recording, so reaching the foot of the page
 * does nothing at all.
 *
 * Afterwards the three ways on appear. "Stop here for today" marks nothing — it
 * is a door, not a button that does something quietly on the way out — and
 * "Mark it unfinished" undoes the completion.
 *
 * One partner cannot see the other's progress. Each row is keyed to the
 * learner's own user id and row level security scopes every read to it; two
 * people working through this course have two accounts and two sets of rows.
 */
export default function TbymFinishLesson({
  courseSlug,
  lessonSlug,
  lessonOrder,
  finished,
  next,
  stopHref,
  hasChapter,
}: {
  courseSlug: string;
  lessonSlug: string;
  lessonOrder: number;
  finished: boolean;
  /** The lesson after this one, where the course has one written. */
  next?: { href: string; order: number; title: string } | null;
  /** Where "Stop here for today" goes. It records nothing on the way. */
  stopHref: string;
  /**
   * Whether the chapter is offered above. The note below names what is
   * optional, so it must not list a card the learner cannot see.
   */
  hasChapter: boolean;
}) {
  const [done, setDone] = useState(finished);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const want = !done;
    setDone(want);
    startTransition(async () => {
      try {
        await setLessonComplete(courseSlug, lessonSlug, want);
        setError(null);
      } catch {
        setDone(!want);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  const label = "text-[13px] uppercase tracking-[0.14em] text-[var(--tb-accent)]";
  // "Stop here for today" is the filled button; Continue is the outlined one
  // beside it, as the lesson template specifies. The approved preview drew
  // Continue as a text link; a button of the same size, unfilled, keeps the
  // two choices legible as a pair without making either the louder.
  const primary =
    "inline-flex items-center justify-center rounded-md bg-[var(--tb-btn)] px-7 py-4 text-[17px] font-medium text-[var(--tb-btn-ink)] disabled:opacity-60";
  const secondary =
    "inline-flex items-center justify-center rounded-md border border-[var(--tb-ink)] px-7 py-4 text-[17px] text-[var(--tb-ink)]";

  return (
    <section className="rounded-md border border-[var(--tb-line)] bg-[var(--tb-card)] px-6 py-7">
      <h2
        className="text-[1.6rem] leading-tight text-[var(--tb-ink)]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Ready to finish for today?
      </h2>

      {done ? (
        <>
          <p className={`mt-4 ${label}`} style={{ fontFamily: "var(--font-tbym-mono)" }} role="status">
            Lesson {lessonOrder} complete
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href={stopHref} className={primary}>
              Stop here for today
            </Link>
            {next && (
              <Link href={next.href} className={secondary}>
                Continue to Lesson {next.order}: {next.title}
              </Link>
            )}
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={toggle}
            className="mt-5 block text-[15px] text-[var(--tb-mute)] underline underline-offset-4 disabled:opacity-60"
          >
            Mark it unfinished
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[var(--tb-mute)]">
            {hasChapter
              ? "The worksheet, the chapter and the reflection questions are not required."
              : "The worksheet and the reflection questions are not required."}{" "}
            Nothing here is scored, and nothing you write is stored.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={toggle}
            aria-pressed={false}
            className={`mt-5 ${primary}`}
          >
            {pending ? "Saving…" : "Mark this lesson complete"}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--tb-accent)]">
          {error}
        </p>
      )}
    </section>
  );
}
