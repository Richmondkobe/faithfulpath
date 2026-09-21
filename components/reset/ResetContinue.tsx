"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setLessonComplete } from "@/app/members/courses/actions";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * Start Here 4's two ways on, which are the end of that page.
 *
 * The page does not take the ordinary next-step block. It is the safety page,
 * and it ends on a decision: go on, or go and get help. A "Next: When Your
 * Soul Is Tired" button beneath those two would be a third way on, phrased as
 * though it were the obvious one.
 *
 * Which comes first is the learner's own starting point, read back from the
 * code Start Here 3 stored. Somebody who said they need support before they
 * begin is shown help first and larger — the same two choices, in the order
 * their own answer asks for.
 *
 * Continuing marks the page complete, which is ordinary page progress and
 * nothing else. Reaching for help marks nothing: no record is kept that
 * somebody went looking, which is the whole of why that route is separate.
 */
export default function ResetContinue({
  pageSlug,
  continueHref,
  continueLabel,
  helpHref,
  helpLabel,
  helpFirst,
}: {
  pageSlug: string;
  continueHref: string;
  continueLabel: string;
  helpHref: string;
  helpLabel: string;
  helpFirst: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onward() {
    startTransition(async () => {
      try {
        await setLessonComplete(RESET_SLUG, pageSlug, true);
      } catch {
        // Not being remembered is not a reason to hold somebody on the page.
        setError("That did not save, but you can still continue.");
      }
      router.push(continueHref);
    });
  }

  const primary =
    "inline-flex w-full items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] sm:w-auto";
  const secondary =
    "inline-flex w-full items-center justify-center rounded-sm border border-[#D9CDBA] px-5 py-3 text-center text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] sm:w-auto";
  // Help, when it is what this learner asked for, is the larger of the two and
  // carries the warmer colour rather than the course's ordinary dark button.
  const helpPrimary =
    "inline-flex w-full items-center justify-center rounded-sm bg-[#8B5E34] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#2B2118] sm:w-auto";

  const keepGoing = (
    <button type="button" onClick={onward} disabled={pending} className={helpFirst ? secondary : primary}>
      {continueLabel}
    </button>
  );
  const getHelp = (
    <a href={helpHref} className={helpFirst ? helpPrimary : secondary}>
      {helpLabel}
    </a>
  );

  return (
    <nav className="mt-10">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        {helpFirst ? getHelp : keepGoing}
        {helpFirst ? keepGoing : getHelp}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </nav>
  );
}
