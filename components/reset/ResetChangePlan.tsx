"use client";

import { useState } from "react";

import ResetPlanCards, { type PlanCard } from "@/components/reset/ResetPlanCards";

/**
 * "Change my plan", near the top of My Retreat Plan.
 *
 * Closed until asked for. The plan a learner is on is the thing this page
 * exists to show them, so the way to change it sits above that — but opened by
 * default it would be a page offering to undo itself before it has said
 * anything.
 *
 * It opens the same seven choices Lesson 5 offers, because they are the same
 * choice. Changing it keeps every finished page: progress is stored per page,
 * and a session finished on one route stays finished on that route.
 */
export default function ResetChangePlan({
  label,
  main,
  others,
  chosen,
  othersLabel,
}: {
  label: string;
  main: PlanCard[];
  others: PlanCard[];
  chosen: string | null;
  othersLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
      >
        {label}
      </button>

      {open && (
        <div className="mt-3 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
          <ResetPlanCards
            main={main}
            others={others}
            chosen={chosen}
            othersLabel={othersLabel}
            othersHeading="Other ways to use this retreat"
          />
          <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
            Changing your plan keeps everything you have already finished.
          </p>
        </div>
      )}
    </div>
  );
}
