"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setDayStatus } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import { DAY_STATUS_LABELS, type DayStatus as Status } from "@/lib/mind-types";
import { mindLessonHref } from "@/lib/mind-links";

const ORDER: Status[] = ["complete", "skip", "not_appropriate", "need_support"];

/**
 * The four things a member can say about a day, and none of them is required.
 *
 * Choosing the same one again clears it. "Skip for now" is styled exactly like
 * the others — the manifest asks for neutral styling, and a skip that looks
 * like a failure is a failure by another name.
 *
 * "I need support" never completes the day and notifies nobody. It offers the
 * way to Finding Help Where You Live and says plainly that choosing it does not
 * tell anyone, because a member deciding whether to press it deserves to know
 * what it does before they press it.
 */
export default function DayStatusControl({
  day,
  saved,
  supportPageSlug,
}: {
  day: number;
  saved: Status | null;
  supportPageSlug: string;
}) {
  const [status, setStatus] = useState<Status | null>(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(option: Status) {
    const next = status === option ? null : option;
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await setDayStatus(day, next);
        setError(null);
      } catch {
        setStatus(previous);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-12 border-t border-line pt-10">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        How did today go?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Answering is optional, and you can change or clear your answer whenever
        you like.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {ORDER.map((option) => {
          const selected = status === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={pending}
              onClick={() => choose(option)}
              className={`rounded-xl border px-5 py-3 text-sm leading-snug transition-colors disabled:opacity-60 ${
                selected
                  ? "border-gold-text bg-sand text-navy"
                  : "border-field text-muted hover:border-gold-text"
              }`}
            >
              {DAY_STATUS_LABELS[option]}
            </button>
          );
        })}
      </div>

      {status === "need_support" && (
        <div className="mt-6 rounded-xl border border-line bg-sand px-5 py-4">
          <p className="text-sm leading-relaxed text-ink">
            Choosing this does not notify anyone — nobody at Faithful Path is
            told, and nothing is sent. It is here so you can find help quickly.
          </p>
          <Link
            href={mindLessonHref(supportPageSlug)}
            className="mt-3 inline-block text-sm text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
          >
            Finding Help Where You Live
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
