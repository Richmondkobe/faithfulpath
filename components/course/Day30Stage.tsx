"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDay30 } from "@/app/members/courses/actions";

/**
 * The second stage of Lesson 28. It opens thirty days after the first checkbox,
 * or whenever the member says their month is done — plenty will have begun the
 * plan before they ever reached this page, and only they know the date.
 */
export default function Day30Stage({
  courseSlug,
  lessonSlug,
  finalAction,
  finalDoneLabel,
  available,
  finalDone,
  opensOn,
}: {
  courseSlug: string;
  lessonSlug: string;
  finalAction: string;
  finalDoneLabel: string;
  available: boolean;
  finalDone: boolean;
  opensOn: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(available);
  const [done, setDone] = useState(finalDone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="mt-16 border-t border-[#E5D9C7] pt-10">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Day 30
      </p>
      <h2
        className="mt-2 text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Complete the course
      </h2>

      {!open ? (
        <div className="mt-4 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
          <p className="leading-relaxed text-[#4A4038]">
            This stage opens a month after you started the plan
            {opensOn ? ` — around ${opensOn}` : ""}. If your month is already
            done, you can open it now.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveDay30(courseSlug, lessonSlug, { monthComplete: true });
                  setOpen(true);
                  router.refresh();
                } catch {
                  setError("That could not be saved. Please try again.");
                }
              })
            }
            className="mt-4 inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-6 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34] disabled:opacity-60"
          >
            My month is complete
          </button>
        </div>
      ) : (
        <>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            {finalAction}
          </p>
          <label
            className={`mt-6 flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-4 text-sm leading-relaxed ${
              done ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA]"
            }`}
          >
            <input
              type="checkbox"
              checked={done}
              disabled={pending}
              onChange={() => {
                const next = !done;
                setDone(next);
                startTransition(async () => {
                  try {
                    await saveDay30(courseSlug, lessonSlug, { finalDone: next });
                    router.refresh();
                  } catch {
                    setDone(!next);
                    setError("That could not be saved. Please try again.");
                  }
                });
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
            />
            <span className="text-[#2B2118]">{finalDoneLabel}</span>
          </label>
          {done && (
            <p className="mt-3 text-sm text-[#5C5147]">
              The course is marked complete.
            </p>
          )}
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
