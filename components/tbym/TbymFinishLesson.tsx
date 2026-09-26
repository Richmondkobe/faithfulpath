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
 * Afterwards the ways on appear. "Stop here for today" marks nothing — it is a
 * door, not a button that does something quietly on the way out — and "Mark it
 * unfinished" undoes the completion.
 *
 * The last lesson ends differently. There is nowhere to continue to, so instead
 * of a Continue button it shows the course's closing word and points both back
 * to the overview and forward to whatever comes next. It is also the one lesson
 * not finishing "for today", so it asks "Ready to finish?" instead.
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
  completionMessage,
  courseHref,
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
  /**
   * The course's closing word, shown once the last lesson is marked complete.
   * Only the last lesson has one, and it is what stands where Continue stands
   * everywhere else.
   */
  completionMessage?: string | null;
  /** Where "Return to Course Overview" goes, on the last lesson. */
  courseHref?: string;
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
        {next ? "Ready to finish for today?" : "Ready to finish?"}
      </h2>

      {done ? (
        <>
          <p className={`mt-4 ${label}`} style={{ fontFamily: "var(--font-tbym-mono)" }} role="status">
            Lesson {lessonOrder} complete
          </p>

          {/* The course's closing word, on the last lesson only. It sits
              above the buttons, where the learner reads it before deciding
              where to go, rather than after. */}
          {!next && completionMessage && (
            <p
              className="mt-5 border-t border-[var(--tb-line)] pt-5 text-[1.15rem] leading-relaxed text-[var(--tb-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {completionMessage}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href={stopHref} className={primary}>
              Stop here for today
            </Link>
            {next ? (
              <Link href={next.href} className={secondary}>
                Continue to Lesson {next.order}: {next.title}
              </Link>
            ) : (
              courseHref && (
                <Link href={courseHref} className={secondary}>
                  Return to Course Overview
                </Link>
              )
            )}
          </div>

          {/* Forward, not back. There is no page to send anybody to yet, so it
              says so rather than being a link that goes nowhere. */}
          {!next && (
            <p
              className="mt-5 inline-block rounded-sm border border-dashed border-[var(--tb-accent)] px-3 py-2 text-[13px] text-[var(--tb-mute)]"
              style={{ fontFamily: "var(--font-tbym-mono)" }}
            >
              Explore your next Faithful Path course or resource — not built yet
            </p>
          )}

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
