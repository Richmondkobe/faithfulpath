"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactNode } from "react";

import { setLessonComplete } from "@/app/members/courses/actions";
import { RESET_SLUG } from "@/lib/reset-simple-links";
import { checkinGuidanceFor, type CheckinQuestion } from "@/lib/reset-checkin";

/**
 * Check-in 1, which decides nothing about anybody and records nothing.
 *
 * Its implementation note is the strictest in the course, and the rules are
 * worth stating where the code is: the answers are evaluated here, in the
 * browser, and none of it is saved, sent, synchronised, logged or analysed —
 * not the answers, not which guidance appeared, not which path was taken, not
 * the order the cards were shown in. No safety record, no score, no alert, no
 * human review. Leaving or reloading the page clears it, which is why nothing
 * is lifted into a URL or storage.
 *
 * Ordinary page completion may be saved, and is the one thing that may: it
 * says a page was finished and nothing about what was said on it.
 *
 * Under guidance A the path cards and the ordinary way on are not rendered at
 * all, and the page is not marked complete. Somebody who has just said they
 * are not safe is not offered a Continue button; they are offered help.
 */
export default function ResetCheckin({
  pageSlug,
  questions,
  guidance,
  cards,
  cardHrefs,
  helpHref,
  showLabel,
}: {
  pageSlug: string;
  questions: CheckinQuestion[];
  /** Each block already rendered, keyed by its letter. */
  guidance: Record<string, ReactNode>;
  cards: { label: string; body: string }[];
  /** Where each card goes, in the order the page lists them. */
  cardHrefs: string[];
  helpHref: string;
  showLabel: string;
}) {
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null));
  const [shown, setShown] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const ready = picked.every((p) => p !== null);

  function answer(q: number, option: number) {
    // Changing an answer takes the guidance away rather than leaving stale
    // advice on screen above the questions that no longer produced it.
    setPicked((prev) => prev.map((p, i) => (i === q ? option : p)));
    setShown(null);
  }

  function take(href: string) {
    // Ordinary page progress, and nothing that says which card this was.
    startTransition(async () => {
      try {
        await setLessonComplete(RESET_SLUG, pageSlug, true);
      } catch {
        // Not being remembered is no reason to stand between somebody and the
        // next thing they decided to do.
      }
      router.push(href);
    });
  }

  // The card each guidance recommends, named by the page's own wording.
  const recommended: Record<string, string> = {
    B: "Seek help first",
    C: "Continue with support",
    D: "Continue preparing",
  };
  const ordered =
    shown && recommended[shown]
      ? [...cards].sort((a, b) =>
          a.label === recommended[shown] ? -1 : b.label === recommended[shown] ? 1 : 0
        )
      : cards;

  return (
    <div className="mt-6">
      {questions.map((q, qi) => (
        <fieldset key={q.n} className="mt-6">
          <legend className="text-[15px] font-medium leading-relaxed text-[#2B2118]">
            {q.n}. {q.prompt}
          </legend>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 transition-colors ${
                  picked[qi] === oi
                    ? "border-[#8B5E34] bg-[#F3EADC]"
                    : "border-[#D9CDBA] hover:border-[#8B5E34]"
                }`}
              >
                <input
                  type="radio"
                  name={`q${q.n}`}
                  checked={picked[qi] === oi}
                  onChange={() => answer(qi, oi)}
                  className="mt-[3px] h-4 w-4 accent-[#8B5E34]"
                />
                <span className="text-[15px] leading-relaxed text-[#2B2118]">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        disabled={!ready}
        onClick={() => setShown(checkinGuidanceFor(picked))}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-sm px-7 py-4 text-center text-[15px] font-medium transition-colors sm:w-auto ${
          ready
            ? "bg-[#2B2118] text-[#FDFAF4] hover:bg-[#8B5E34]"
            : "cursor-not-allowed border border-[#D9CDBA] text-[#8B8177]"
        }`}
      >
        {showLabel}
      </button>
      {!ready && (
        <p className="mt-2 text-sm text-[#6B5F53]">
          Answer all three questions to see your guidance.
        </p>
      )}

      {shown && (
        <section
          className={`mt-8 rounded-sm px-5 py-5 ${
            shown === "A"
              ? "border border-[#C9A227] bg-[#FBF6E9]"
              : "border border-[#E5D9C7] bg-[#F7F1E6]"
          }`}
        >
          {guidance[shown]}
          {shown === "A" && (
            <p className="mt-5">
              <a
                href={helpHref}
                className="inline-flex w-full items-center justify-center rounded-sm bg-[#8B5E34] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#2B2118] sm:w-auto"
              >
                Find support where I live
              </a>
            </p>
          )}
        </section>
      )}

      {/* Guidance A shows no cards and no way on. Every other guidance keeps
          all of them visible after the recommended one: the choice stays the
          learner's, and the recommendation is a recommendation. */}
      {shown && shown !== "A" && (
        <div className="mt-8">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            Choose your next step
          </h3>
          <ul className="mt-3 space-y-3">
            {ordered.map((card) => {
              const href = cardHrefs[cards.findIndex((c) => c.label === card.label)] ?? helpHref;
              const first = recommended[shown] === card.label;
              return (
                <li key={card.label}>
                  <button
                    type="button"
                    onClick={() => take(href)}
                    className={`w-full rounded-sm border px-5 py-4 text-left transition-colors ${
                      first
                        ? "border-[#8B5E34] bg-[#F3EADC]"
                        : "border-[#D9CDBA] hover:border-[#8B5E34]"
                    }`}
                  >
                    <span className="block font-medium text-[#2B2118]">
                      {card.label}
                      {first && (
                        <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                          Suggested
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
                      {card.body}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
