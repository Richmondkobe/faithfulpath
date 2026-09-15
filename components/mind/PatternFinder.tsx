"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { savePatternFinder } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import { mindLessonHref } from "@/lib/mind-links";

export type Pattern = {
  id: string;
  text: string;
  lesson: number | null;
};

/**
 * The Pattern Finder at the start of Module 2.
 *
 * Not a test and not a diagnosis. Any number of patterns may be ticked,
 * including none, and "I am not sure" is a complete answer. Nothing is scored,
 * no type is worked out, and no label is ever shown or stored — the only result
 * is a sentence saying some lessons may be helpful, and links to them.
 *
 * Module 2 is not reordered and no lesson is hidden. The suggestions sit on
 * this page; the module keeps its own order everywhere else.
 */
export default function PatternFinder({
  checkinSlug,
  patterns,
  resultText,
  lessonSlugByNumber,
  lessonTitleByNumber,
  saved,
}: {
  checkinSlug: string;
  patterns: Pattern[];
  resultText: string;
  lessonSlugByNumber: Record<number, string>;
  lessonTitleByNumber: Record<number, string>;
  saved: string[];
}) {
  const [selected, setSelected] = useState<string[]>(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    const previous = selected;
    setSelected(next);
    startTransition(async () => {
      try {
        await savePatternFinder(checkinSlug, next);
        setError(null);
      } catch {
        setSelected(previous);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  // Only patterns that point at a lesson suggest one. "I am not sure" carries
  // no lesson and is a perfectly good answer on its own.
  const suggested = patterns.filter(
    (p) => selected.includes(p.id) && p.lesson !== null && lessonSlugByNumber[p.lesson]
  );

  return (
    <section className="mt-8">
      <ul className="space-y-2">
        {patterns.map((pattern) => {
          const checked = selected.includes(pattern.id);
          return (
            <li key={pattern.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed transition-colors ${
                  checked
                    ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                    : "border-[#D9CDBA] text-[#4A4038] hover:border-[#8B5E34]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={pending}
                  onChange={() => toggle(pattern.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
                />
                <span>{pattern.text}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {suggested.length > 0 && (
        <div className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
          <p className="text-[#2B2118]">{resultText}</p>
          <ul className="mt-4 space-y-2">
            {suggested.map((pattern) => (
              <li key={pattern.id}>
                <Link
                  href={mindLessonHref(lessonSlugByNumber[pattern.lesson!])}
                  className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  Lesson {pattern.lesson}
                  {lessonTitleByNumber[pattern.lesson!]
                    ? `: ${lessonTitleByNumber[pattern.lesson!]}`
                    : ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-sm leading-relaxed text-[#6B5F53]">
        Nothing here is scored, and none of it describes you. Tick as many or as
        few as you like, or none at all. The module keeps its own order either
        way, and every lesson stays open to you.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
