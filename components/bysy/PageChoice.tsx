"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { bysySupportHref } from "@/lib/bysy-links";
import type { ChoiceOption } from "@/lib/bysy-types";

/**
 * The choice on a check-in or the closing page, to §2 and §7.
 *
 * An ordinary choice may be saved, is shown back as "Your current choice",
 * and can be changed at any time. It unlocks nothing, blocks nothing and is
 * never counted — §2 is explicit that selecting a path scores nothing.
 *
 * The safety route is a different thing and is kept a different thing. §7:
 * "Safety routes are shown separately from ordinary choices, never saved, and
 * display the support route locally for that session only." So it is not one
 * more option in the list, it writes nothing, it is never reflected back, and
 * choosing it leaves no trace once the page is closed — because a stored
 * record that somebody chose to seek safety support is exactly the record §4
 * exists to prevent.
 */
export default function PageChoice({
  pageSlug,
  options,
  safetyOption,
  saved,
}: {
  pageSlug: string;
  options: ChoiceOption[];
  /** Shown apart from the list, and never stored. */
  safetyOption?: ChoiceOption | null;
  saved: string;
}) {
  const [chosen, setChosen] = useState(saved);
  const [safetyChosen, setSafetyChosen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(title: string) {
    const next = chosen === title ? "" : title;
    setChosen(next);
    setSafetyChosen(false);
    startTransition(async () => {
      try {
        await saveToolRows(pageSlug, "C", [[next]]);
        setError(null);
      } catch {
        setError("That could not be saved, but your choice still stands on this page.");
      }
    });
  }

  return (
    <div className="mt-6">
      <ul className="space-y-3">
        {options.map((option) => {
          const selected = chosen === option.title;
          return (
            <li key={option.title}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={pending}
                onClick={() => choose(option.title)}
                className={`w-full rounded-sm border px-5 py-4 text-left transition-colors ${
                  selected
                    ? "border-[#8B5E34] bg-[#F3EADC]"
                    : "border-[#D9CDBA] hover:border-[#8B5E34]"
                }`}
              >
                <span className="block font-medium text-[#2B2118]">{option.title}</span>
                {option.body && (
                  <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
                    {option.body}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && (
        <p className="mt-5 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
          Your current choice:{" "}
          <strong className="font-medium text-[#2B2118]">{chosen}</strong>. You
          can change it at any time, and it decides nothing on its own.
        </p>
      )}

      {safetyOption && (
        <div className="mt-6 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-5 py-5">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            A separate route
          </h3>
          <button
            type="button"
            onClick={() => setSafetyChosen((on) => !on)}
            aria-pressed={safetyChosen}
            className={`mt-3 w-full rounded-sm border px-5 py-4 text-left transition-colors ${
              safetyChosen ? "border-[#8B3A2E] bg-[#FBF1EF]" : "border-[#D9CDBA] hover:border-[#8B5E34]"
            }`}
          >
            <span className="block font-medium text-[#2B2118]">{safetyOption.title}</span>
            {safetyOption.body && (
              <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
                {safetyOption.body}
              </span>
            )}
          </button>

          {safetyChosen && (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-[#4A4038]">
                Do not wait until you have finished the course, and do not
                announce a decision to someone whose reaction you fear. A
                specialist service can help you think about timing and safety in
                a way this course cannot.
              </p>
              <p className="mt-4">
                <Link
                  href={bysySupportHref()}
                  className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
                >
                  Finding Help Where You Live
                </Link>
              </p>
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
            This one is never saved. It is not recorded, not counted, and not
            shown back to you anywhere — choosing it only opens the support
            route on this screen.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </div>
  );
}
