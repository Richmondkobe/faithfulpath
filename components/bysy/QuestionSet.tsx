"use client";

import { useState, useTransition } from "react";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { FIELD_LIMIT, MONITORING_NOTE } from "@/lib/bysy-wording";

/**
 * One section of Questions Before Engagement, for §5.
 *
 * The questions are the page's own, parsed from it rather than retyped, so the
 * form cannot come to ask something the page does not say.
 *
 * Each section saves separately. That is not a UI preference: there are 64
 * questions and a part holds 40 rows, so one part per section is what fits —
 * and it is why `toolIndex` had to learn about numbered parts, since reading
 * only the first letter mapped all ten sections onto part Q and they
 * overwrote each other in one row.
 *
 * The judgement selector is offered on every question and required on none.
 * The page says *Yes / Not sure / No* is for questions that ask for a
 * judgement, and that "not sure is an honest answer, not a failure"; the
 * others ask for information. Which is which is the learner's reading, not a
 * classification to hard-code, and a question marked as needing an answer it
 * does not need is a small accusation.
 *
 * Nothing is counted. §5's own page says these questions "do not score, and
 * they do not certify a relationship", so there is no total, no completion
 * proportion, and no indication anywhere that some number of answers is the
 * expected one.
 */
export default function QuestionSet({
  pageSlug,
  part,
  questions,
  saved,
  choice,
  showMonitoringNote = false,
}: {
  pageSlug: string;
  part: string;
  /** The section's questions, in the page's own wording. */
  questions: string[];
  /** Rows of [judgement, answer]; the choice, when present, is row 0. */
  saved: string[][];
  /** Section 10's single three-way answer, which is not a question. */
  choice?: { prompt: string; options: string[] };
  showMonitoringNote?: boolean;
}) {
  const offset = choice ? 1 : 0;
  const [rows, setRows] = useState<string[][]>(() =>
    Array.from({ length: questions.length + offset }, (_, i) => [
      saved[i]?.[0] ?? "",
      saved[i]?.[1] ?? "",
    ])
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setCell(r: number, c: number, value: string) {
    setRows((cur) => cur.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)));
    setSavedAt(null);
  }

  function save() {
    startTransition(async () => {
      try {
        await saveToolRows(pageSlug, part, rows);
        setSavedAt(Date.now());
        setError(null);
      } catch {
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-5">
      {showMonitoringNote && (
        <p className="rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
          <strong className="font-medium text-[#2B2118]">Privacy and safety.</strong>{" "}
          {MONITORING_NOTE}
        </p>
      )}

      {choice && (
        <div className="mt-4 rounded-sm border border-[#D9CDBA] bg-[#F7F1E6] px-4 py-4">
          <label
            htmlFor={`${part}-choice`}
            className="block text-sm leading-relaxed text-[#2B2118]"
          >
            {choice.prompt}
          </label>
          <select
            id={`${part}-choice`}
            value={rows[0]?.[0] ?? ""}
            onChange={(e) => setCell(0, 0, e.target.value)}
            className="mt-2 rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] outline-none focus:border-[#8B5E34]"
          >
            <option value="">—</option>
            {choice.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )}

      <ol className="mt-4 space-y-4">
        {questions.map((q, i) => {
          const r = i + offset;
          return (
            <li key={q} className="rounded-sm border border-[#E5D9C7] px-4 py-4">
              <label
                htmlFor={`${part}-a-${r}`}
                className="block text-sm leading-relaxed text-[#2B2118]"
              >
                {q}
              </label>
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <select
                  aria-label="Yes, not sure, or no — if this question asks for one"
                  value={rows[r]?.[0] ?? ""}
                  onChange={(e) => setCell(r, 0, e.target.value)}
                  className="rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] outline-none focus:border-[#8B5E34]"
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="Not sure">Not sure</option>
                  <option value="No">No</option>
                </select>
                <textarea
                  id={`${part}-a-${r}`}
                  rows={2}
                  maxLength={FIELD_LIMIT}
                  value={rows[r]?.[1] ?? ""}
                  onChange={(e) => setCell(r, 1, e.target.value)}
                  className="min-w-0 flex-1 rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
                />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save this section"}
        </button>
        {savedAt && !pending && <span className="text-sm text-[#6B5F53]">Saved.</span>}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
