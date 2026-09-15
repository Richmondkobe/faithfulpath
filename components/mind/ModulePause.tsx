"use client";

import { useState, useTransition } from "react";
import { saveCheckinAnswers } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * A module pause.
 *
 * Unscored, optional, and gating nothing — a member moves on to the next module
 * whether they write anything here or not, and the page says so. There are no
 * right answers, so nothing is checked, compared or fed back.
 */
export default function ModulePause({
  checkinSlug,
  questions,
  saved,
}: {
  checkinSlug: string;
  questions: string[];
  saved: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((_, i) => [`q${i}`, saved[`q${i}`] ?? ""]))
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await saveCheckinAnswers(checkinSlug, values);
        setSavedAt(Date.now());
        setError(null);
      } catch {
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="space-y-7">
        {questions.map((question, i) => (
          <div key={i}>
            <label
              htmlFor={`q${i}`}
              className="block text-lg leading-snug text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {question}
            </label>
            <textarea
              id={`q${i}`}
              rows={4}
              value={values[`q${i}`] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [`q${i}`]: e.target.value }))
              }
              placeholder="Answer if you want to. You can leave this blank."
              className="mt-3 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm leading-relaxed text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save what I have written"}
        </button>
        {savedAt && !pending && <span className="text-sm text-[#6B5F53]">Saved.</span>}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        Private, optional and unscored. Nothing here is marked, and you can carry
        on to the next module whether you write anything or not.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
