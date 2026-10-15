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
      <section className="mt-5 rounded-xl border border-danger bg-danger-bg px-5 py-5">
        <h4
          className="text-xl text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Please stop here and get individual advice
        </h4>
        <p className="mt-3 leading-relaxed text-ink">
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
                className="rounded-xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-ink"
              >
                {option}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5">
          <Link
            href={bysySupportHref()}
            className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            Finding Help Where You Live
          </Link>
        </div>
        {jumpTo && (
          <div className="mt-5">
            <button
              type="button"
              onClick={jumpTo.go}
              className="rounded-xl border-[1.5px] border-navy bg-cream px-6 py-3 text-sm text-navy transition-colors hover:border-gold-text"
            >
              {jumpTo.label}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAnswers({})}
          className="mt-5 text-sm text-muted underline underline-offset-4 transition-colors hover:text-navy"
        >
          Go back to the questions
        </button>
        <p className="mt-4 text-sm leading-relaxed text-muted">
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
          <li key={i} className="rounded-xl border border-line px-4 py-4">
            <p className="text-sm leading-relaxed text-navy">{item}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {(["yes", "no"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={answers[i] === value}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: value }))}
                  className={`rounded-xl border px-5 py-2 text-sm transition-colors ${
                    answers[i] === value
                      ? "border-gold-text bg-sand text-navy"
                      : "border-field text-muted hover:border-gold-text"
                  }`}
                >
                  {value === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Nothing on this screen is saved. It is not counted, and no record is
        kept of which answers you gave.
      </p>
    </section>
  );
}
