"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setLessonFinished } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * The finish panel — the one thing that marks a lesson finished.
 *
 * Nothing else in this course writes completion. There is no scroll tracking,
 * no observer at the foot of the page and no handler on the end of the
 * recording: a lesson is finished when a member presses the button here and at
 * no other moment. That is deliberate, and it is why the panel asks before it
 * claims — "Ready to finish for today?" and then the button, rather than a page
 * that quietly decides on the member's behalf that they are done.
 *
 * Afterwards the member is offered two ways on, weighted the same: stop, or
 * continue. This is a course about a mind that will not stop, and a page that
 * pushed hardest towards the next lesson would teach the opposite of what it
 * says. Neither is a requirement — the lesson is already finished by then.
 */
export default function FinishLesson({
  lessonSlug,
  label,
  finished,
  next,
  courseHref,
}: {
  lessonSlug: string;
  label: string;
  finished: boolean;
  /** The lesson after this one, where there is one. */
  next?: { href: string; title: string; order?: number | null } | null;
  /** Where "Stop here for today" goes once the lesson is finished. */
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
        await setLessonFinished(lessonSlug, want);
        setError(null);
      } catch {
        setDone(!want);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  const continueLabel = next
    ? typeof next.order === "number"
      ? `Continue to Lesson ${next.order}`
      : `Continue: ${next.title}`
    : null;

  const primary =
    "inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60";
  const secondary =
    "inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] bg-white px-7 py-4 text-[15px] text-[#2B2118] transition-colors hover:border-[#8B5E34] disabled:opacity-60";

  return (
    <section className="mt-12 border-t border-[#E5D9C7] pt-10">
      {done ? (
        <div className="rounded-sm border border-[#8B5E34] bg-[#F3EADC] px-5 py-5">
          <p className="text-[#2B2118]">You have finished this lesson.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
            It stays open to you. Come back whenever you want to.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {courseHref && (
              <Link href={courseHref} className={primary}>
                Stop here for today
              </Link>
            )}
            {next && (
              <span className="inline-flex flex-col">
                <Link href={next.href} className={secondary}>
                  {continueLabel}
                </Link>
                <span className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
                  {next.title}
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={toggle}
            className="mt-5 block text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118] disabled:opacity-60"
          >
            Mark it unfinished
          </button>
        </div>
      ) : (
        <>
          <h2
            className="text-2xl text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            Ready to finish for today?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">
            The worksheet, the chapter and the reflection questions are not
            required. Finishing does not depend on any of them, or on having
            tried the step.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={toggle}
            className={`mt-5 ${primary}`}
          >
            {pending ? "Saving…" : label}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
