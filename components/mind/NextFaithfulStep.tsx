"use client";

import { useState, useTransition } from "react";
import { saveNextStep } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import { NEXT_STEP_LABELS, type NextStep } from "@/lib/mind-types";

const OPTIONS: NextStep[] = ["intend", "not_today", "not_appropriate"];

/**
 * "Your next faithful step" — three answers, all private, none required.
 *
 * Choosing the same answer again clears it, so a member is never stuck with a
 * response they no longer mean. None of this touches completion: the finish
 * button below is separate, and says so.
 *
 * `secondary` is for the slide lessons, where this sits underneath the one
 * practice the lesson actually asks for. There it is a suggestion — tell
 * someone, if you have someone safe to tell — not a second thing to do, so it
 * takes the quiet label styling rather than a second full-sized heading, and
 * leaves the rule and the spacing above it to the page.
 */
export default function NextFaithfulStep({
  lessonSlug,
  action,
  saved,
  secondary = false,
}: {
  lessonSlug: string;
  action: string;
  saved: NextStep | null;
  secondary?: boolean;
}) {
  const [choice, setChoice] = useState<NextStep | null>(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(option: NextStep) {
    const next = choice === option ? null : option;
    const previous = choice;
    setChoice(next);
    startTransition(async () => {
      try {
        await saveNextStep(lessonSlug, next);
        setError(null);
      } catch {
        setChoice(previous);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  // The three buttons and the note are the same either way; only the heading
  // and the weight of the invitation above them change.
  const body = (
    <>
      <div className={`flex flex-wrap gap-3 ${secondary ? "mt-4" : "mt-6"}`}>
        {OPTIONS.map((option) => {
          const selected = choice === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={pending}
              onClick={() => choose(option)}
              className={`rounded-sm border px-5 py-3 text-sm leading-snug transition-colors disabled:opacity-60 ${
                selected
                  ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                  : "border-[#D9CDBA] text-[#5C5147] hover:border-[#8B5E34]"
              }`}
            >
              {NEXT_STEP_LABELS[option]}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        This answer is yours alone, it is optional, and you can change it at any
        time. It does not affect finishing the lesson.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </>
  );

  if (secondary) {
    return (
      <section>
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          If it helps, tell someone
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[#4A4038]">
          {action}
        </p>
        {body}
      </section>
    );
  }

  return (
    <section className="mt-14 border-t border-[#E5D9C7] pt-10">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Your next faithful step
      </h2>
      <p
        className="mt-4 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        {action}
      </p>
      {body}
    </section>
  );
}
