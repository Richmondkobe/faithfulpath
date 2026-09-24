"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setLessonFinished } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * The finish button — the one thing that marks a lesson finished.
 *
 * It is a button rather than a checkbox beside the action, because in this
 * course the step and the completion are deliberately not the same act: a
 * member may finish a lesson having decided the step is not for them.
 */
export default function FinishLesson({
  lessonSlug,
  label,
  finished,
  next,
}: {
  lessonSlug: string;
  label: string;
  finished: boolean;
  /** The lesson after this one, where there is one. */
  next?: { href: string; title: string } | null;
}) {
  const [done, setDone] = useState(finished);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(thenGo = false) {
    const want = !done;
    setDone(want);
    startTransition(async () => {
      try {
        await setLessonFinished(lessonSlug, want);
        setError(null);
        // Finishing carries the member on to the next lesson. Unfinishing
        // leaves them where they are, which is where they asked to be.
        if (thenGo && want && next) router.push(next.href);
      } catch {
        setDone(!want);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-12 border-t border-[#E5D9C7] pt-10">
      {done ? (
        <div className="rounded-sm border border-[#8B5E34] bg-[#F3EADC] px-5 py-5">
          <p className="text-[#2B2118]">You have finished this lesson.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
            It stays open to you. Come back to it whenever you want to.
          </p>
          {next && (
            <p className="mt-4">
              <Link
                href={next.href}
                className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
              >
                Continue: {next.title}
              </Link>
            </p>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => toggle()}
            className="mt-4 block text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118] disabled:opacity-60"
          >
            Mark it unfinished
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => toggle(true)}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Saving…" : label}
          </button>
          <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
            Finishing is up to you. It does not depend on trying the step,
            writing anything down, or opening the worksheet.
          </p>
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
