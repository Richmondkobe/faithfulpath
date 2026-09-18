"use client";

import { useState, useTransition } from "react";
import { markCourseComplete } from "@/app/members/courses/before-you-say-yes/actions";

/**
 * "Completed Before You Say Yes", for §2.
 *
 * The wording is the whole of the constraint. §2 rules out *ready*, *prepared*,
 * *certified* and anything equivalent, and gives the reason: the name is what a
 * learner may show someone else. A record that reads as a verdict on a
 * relationship is a document that can be produced in an argument about one.
 *
 * So it records that the course was completed and nothing else. Not which route
 * was taken, not what was concluded, not whether the learner is dating, engaged
 * or has ended something — and there is no certificate to download, because a
 * file that leaves this account is a file the other person can be shown.
 *
 * It can be undone. Someone who marks it and then finds they are not finished —
 * or who would rather it were not on their account at all — should not have to
 * ask us to remove it.
 */
export default function CompletionRecord({ complete }: { complete: boolean }) {
  const [done, setDone] = useState(complete);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(next: boolean) {
    startTransition(async () => {
      try {
        await markCourseComplete(next);
        setDone(next);
        setError(null);
      } catch {
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
      {done ? (
        <>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            Completed Before You Say Yes
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#4A4038]">
            That is the whole of the record: that you worked through it. It says
            nothing about your relationship, and it is not a judgement that you
            are ready for anything.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => set(false)}
            className="mt-4 text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118] disabled:opacity-60"
          >
            {pending ? "Removing…" : "Remove this from my account"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-[#4A4038]">
            You can mark this course completed. It records that you worked
            through it and nothing more — not what you decided, not which route
            you took, and not that you are ready for anything.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => set(true)}
            className="mt-4 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Mark as completed"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
