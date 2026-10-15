"use client";

import { useState, useTransition } from "react";
import { saveMindPath } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * Choose Your Path and Pace.
 *
 * Optional, and changeable at any time. Picking the same path again clears it,
 * because "I would rather not choose" is a real answer. Changing a path alters
 * only the order the course suggests — nothing you have finished, written or
 * visited moves, and the page says so where the member can see it.
 */
export default function PathChoice({
  options,
  saved,
}: {
  options: { id: string; label: string }[];
  saved: string | null;
}) {
  const [choice, setChoice] = useState<string | null>(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(id: string) {
    const next = choice === id ? null : id;
    const previous = choice;
    setChoice(next);
    startTransition(async () => {
      try {
        await saveMindPath(next ?? "");
        setError(null);
      } catch {
        setChoice(previous);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-10 rounded-xl border border-line bg-sand px-5 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Your path
      </h2>

      <ul className="mt-4 space-y-2">
        {options.map((option) => {
          const selected = choice === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={pending}
                onClick={() => choose(option.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm leading-snug transition-colors disabled:opacity-60 ${
                  selected
                    ? "border-gold-text bg-white text-navy"
                    : "border-field text-muted hover:border-gold-text"
                }`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Choosing is optional, and you can change it whenever you like. Your path
        only changes the order the course suggests. Nothing you have finished,
        written or visited is affected.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
