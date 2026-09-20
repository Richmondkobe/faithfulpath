"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bysySupportHref } from "@/lib/bysy-links";

/**
 * A safety check inside a workbook, to §4 and §3.
 *
 * Seven pages carry one, and their notes all say the same three things: answer
 * the items locally, never store which were ticked, and show the specialist
 * route the moment any of them is Yes.
 *
 * So there is no server action here and no state that outlives the page. A Yes
 * replaces the screen rather than adding a note beneath it — somebody who has
 * just ticked "they have threatened to harm me" should not be reading the next
 * seven warning signs, and §3 is explicit that the route never sits among
 * ordinary content as one option.
 *
 * "No to everything" is not a verdict either. It moves on without comment,
 * because a screen that congratulated someone on being safe would be making a
 * judgement this course does not make.
 */
export default function SafetyCheck({
  items,
  intro,
  route,
  routeOptions = [],
  jumpTo,
  onRoute,
}: {
  items: string[];
  intro?: React.ReactNode;
  /**
   * The page's own instruction for a Yes, rendered instead of a general one.
   *
   * These differ in ways that matter and are not interchangeable. Lesson 10's
   * says not to arrange a family meeting and not to tell the relatives
   * involved that help is being sought; Lesson 12's says not to obtain
   * records, contact former partners, or ask friends to investigate. Writing a
   * single reassuring paragraph for all seven would have lost both.
   */
  route?: React.ReactNode;
  /** Routes the page offers to choose between, shown as a list. Never stored. */
  routeOptions?: string[];
  /**
   * The screen the stop box tells the learner to go to.
   *
   * Lesson 19's says "do not use Screens 3–7, go straight to Screen 8" while
   * Next is withdrawn — so the instruction named a destination with no way to
   * reach it. The screens in between stay skipped rather than walked through.
   */
  jumpTo?: { label: string; go: () => void } | null;
  /** Told when the route appears, so the page can stop offering "Next". */
  onRoute?: (showing: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, "yes" | "no">>({});
  const anyYes = Object.values(answers).includes("yes");

  useEffect(() => {
    onRoute?.(anyYes);
  }, [anyYes, onRoute]);

  if (anyYes) {
    return (
      <section className="mt-5 rounded-sm border border-[#8B3A2E] bg-[#FBF1EF] px-5 py-5">
        <h4
          className="text-xl text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Please stop here and get individual advice
        </h4>
        <p className="mt-3 leading-relaxed text-[#4A4038]">
          What you have just marked is more serious than the rest of this
          lesson, and it is not something to weigh up against warning signs. A
          specialist service can help you think about what to do next, and about
          timing and safety, in a way a workbook cannot.
        </p>

        {route}

        {routeOptions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {routeOptions.map((option) => (
              <li
                key={option}
                className="rounded-sm border border-[#E5D9C7] bg-[#FDFAF4] px-4 py-3 text-sm leading-relaxed text-[#4A4038]"
              >
                {option}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5">
          <Link
            href={bysySupportHref()}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Finding Help Where You Live
          </Link>
        </div>
        {jumpTo && (
          <div className="mt-5">
            <button
              type="button"
              onClick={jumpTo.go}
              className="rounded-sm border border-[#D9CDBA] bg-[#FDFAF4] px-6 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
            >
              {jumpTo.label}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAnswers({})}
          className="mt-5 text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Go back to the questions
        </button>
        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
          Nothing you marked here has been saved, and nothing about it is
          recorded anywhere in your account.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5">
      {intro}
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-sm border border-[#E5D9C7] px-4 py-4">
            <p className="text-sm leading-relaxed text-[#2B2118]">{item}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {(["yes", "no"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={answers[i] === value}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: value }))}
                  className={`rounded-sm border px-5 py-2 text-sm transition-colors ${
                    answers[i] === value
                      ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                      : "border-[#D9CDBA] text-[#5C5147] hover:border-[#8B5E34]"
                  }`}
                >
                  {value === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        Nothing on this screen is saved. It is not counted, and no record is
        kept of which answers you gave.
      </p>
    </section>
  );
}
