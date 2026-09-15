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
    <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
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
                className={`w-full rounded-sm border px-4 py-3 text-left text-sm leading-snug transition-colors disabled:opacity-60 ${
                  selected
                    ? "border-[#8B5E34] bg-white text-[#2B2118]"
                    : "border-[#D9CDBA] text-[#5C5147] hover:border-[#8B5E34]"
                }`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        Choosing is optional, and you can change it whenever you like. Your path
        only changes the order the course suggests. Nothing you have finished,
        written or visited is affected.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
