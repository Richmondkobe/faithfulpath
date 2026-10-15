"use client";

import { useState, useTransition } from "react";

import { setLessonComplete } from "@/app/members/courses/actions";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * The "☐" line at the foot of a page, as a control rather than a character.
 *
 * Every page writes its completion line the same way — "☐ I am ready to
 * continue." — and the implementation notes are consistent about what it may
 * hold: ordinary page progress and nothing else. No written answer, no route,
 * no record of what was chosen. So this stores a date against the page's slug
 * in course_progress, which is the same row an ordinary lesson uses, and
 * carries nothing about the learner beyond having reached the end.
 *
 * A failure leaves the box ticked and says the tick did not save. The
 * alternative — silently reverting it — tells a learner they did not finish
 * something they did.
 */
export default function ResetStep({
  pageSlug,
  label,
  done,
  disabled = false,
  disabledHint,
}: {
  pageSlug: string;
  label: string;
  done: boolean;
  /** Lesson 5 cannot be finished before a retreat has been chosen. */
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [checked, setChecked] = useState(done);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      try {
        await setLessonComplete(RESET_SLUG, pageSlug, next);
        setError(null);
      } catch {
        setError("That did not save, but it still stands on this page.");
      }
    });
  }

  return (
    <div className="mt-4">
      <label
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
          disabled
            ? "cursor-not-allowed border-line text-muted"
            : "cursor-pointer border-field hover:border-gold-text"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={pending || disabled}
          onChange={toggle}
          className="mt-[3px] h-4 w-4 accent-gold-text"
        />
        <span
          className={`text-[15px] leading-relaxed ${
            disabled ? "text-muted" : "text-navy"
          }`}
        >
          {label}
        </span>
      </label>
      {disabled && disabledHint && (
        <p className="mt-2 text-sm text-muted">{disabledHint}</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
