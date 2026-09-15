"use client";

import { useState, useTransition } from "react";
import { saveIntentions } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * Before You Begin: two private answers, both optional.
 *
 * Saved against the stable ids from the page's front matter, so the answers
 * stay attached to their questions even if the questions are reordered later.
 */
export default function Intentions({
  questions,
  saved,
}: {
  questions: { id: string; prompt: string }[];
  saved: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, saved[q.id] ?? ""]))
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await saveIntentions(values);
        setSavedAt(Date.now());
        setError(null);
      } catch {
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-10">
      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id}>
            <label
              htmlFor={question.id}
              className="block text-lg leading-snug text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {question.prompt}
            </label>
            <textarea
              id={question.id}
              rows={4}
              value={values[question.id] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [question.id]: e.target.value }))
              }
              placeholder="Write as much or as little as you like."
              className="mt-3 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm leading-relaxed text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {savedAt && !pending && (
          <span className="text-sm text-[#6B5F53]">Saved.</span>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        These answers are yours alone and entirely optional. Leaving them blank
        changes nothing.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
