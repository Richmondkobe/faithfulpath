"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveResetPlan } from "@/app/members/courses/christian-spiritual-reset/actions";

export type PlanCard = { id: string; label: string; body: string; note?: string };

/**
 * Lesson 5's retreat choice: three lengths, and four formats behind a
 * disclosure.
 *
 * Nothing is preselected. Its note says so twice, and once specifically about
 * the learner who chose "Choose a shorter retreat" on Check-in 1 — a
 * suggestion made on one page is not an answer given on another, and filling
 * it in for them would turn a check-in's cautious advice into a decision they
 * never made.
 *
 * Choosing one of the seven is what enables the completion checkbox below.
 * Somebody who chooses a specialist format has chosen a plan; they are not
 * then asked to pick three days, one day or three hours as well.
 *
 * The code is all that is stored. "pcouple" says which plan; it does not say
 * anything about the person.
 */
export default function ResetPlanCards({
  main,
  others,
  chosen,
  othersLabel,
  othersHeading,
  onChosen,
}: {
  main: PlanCard[];
  others: PlanCard[];
  chosen: string | null;
  othersLabel: string;
  /** The line the page introduces the formats with. */
  othersHeading?: string;
  /** Lets the page enable its completion checkbox once a plan exists. */
  onChosen?: (id: string) => void;
}) {
  const [picked, setPicked] = useState(chosen);
  const [open, setOpen] = useState(Boolean(chosen && others.some((o) => o.id === chosen)));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function choose(id: string) {
    setPicked(id);
    onChosen?.(id);
    startTransition(async () => {
      try {
        await saveResetPlan(id);
        setError(null);
        // The completion checkbox below is closed until a plan exists, and
        // whether one exists is decided on the server.
        router.refresh();
      } catch {
        setError("That did not save. Your choice still stands on this page.");
      }
    });
  }

  const card = (c: PlanCard) => (
    <li key={c.id}>
      <button
        type="button"
        aria-pressed={picked === c.id}
        disabled={pending}
        onClick={() => choose(c.id)}
        className={`w-full rounded-xl border px-5 py-4 text-left transition-colors ${
          picked === c.id
            ? "border-gold-text bg-sand"
            : "border-field hover:border-gold-text"
        }`}
      >
        <span className="block font-medium text-navy">
          {c.label}
          {c.note && (
            <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
              {c.note}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-ink">{c.body}</span>
      </button>
    </li>
  );

  return (
    <div className="mt-4">
      <ul className="space-y-3">{main.map(card)}</ul>

      {/* The disclosure closes the control, so it carries the space beneath
          it whether it is open or shut — a closed link and an open last card
          should both sit the same distance from whatever follows. */}
      {others.length > 0 && (
        <div className="mt-5 mb-1">
          {othersHeading && (
            <p className="text-[15px] font-medium text-navy">{othersHeading}</p>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-1 text-sm text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
          >
            {othersLabel}
          </button>
          {open && <ul className="mt-3 space-y-3">{others.map(card)}</ul>}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
