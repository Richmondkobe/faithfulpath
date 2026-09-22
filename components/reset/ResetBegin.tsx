"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setLessonComplete } from "@/app/members/courses/actions";
import { saveResetPlan } from "@/app/members/courses/christian-spiritual-reset/actions";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * My Retreat Plan's one primary button.
 *
 * Exactly one, below whichever view is shown, and never repeated inside the
 * Quick Start list — its note says so, and a second copy of the only way
 * forward is a reader wondering which one is the real one.
 *
 * Pressing it marks the page complete, which is the only progress this page
 * has: there is no old page it corresponds to, so nobody arrives already
 * finished.
 *
 * A learner who reached Quick Start without having chosen a retreat has their
 * plan set to three hours here, at the moment they begin one — not earlier, on
 * a page that was only showing them what a reset looks like.
 */
export default function ResetBegin({
  pageSlug,
  href,
  label,
  setPlanToThreeHour,
}: {
  pageSlug: string;
  href: string;
  label: string;
  setPlanToThreeHour: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function begin() {
    startTransition(async () => {
      try {
        if (setPlanToThreeHour) await saveResetPlan("p3h");
        await setLessonComplete(RESET_SLUG, pageSlug, true);
      } catch {
        // Beginning matters more than recording that it began.
        setError("That did not save, but your retreat still begins.");
      }
      router.push(href);
    });
  }

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={begin}
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] sm:w-auto"
      >
        {label}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </div>
  );
}
