"use client";

import { useState, useTransition } from "react";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { FIELD_LIMIT } from "@/lib/bysy-wording";

/**
 * "Write my answer" — the optional box under Pause and think.
 *
 * Optional in the sense the page means it: closed until asked for, and a lesson
 * is finished whether or not anything is written. It saves as an ordinary
 * private reflection, and it is shown nowhere else — not summarised, not
 * counted, and not surfaced by any later page except through the learner's own
 * "View my earlier answers".
 *
 * Two lessons have no box at all. Lesson 6 and Lesson 19 say so in their own
 * implementation notes, and Lesson 19's rule is the strictest in the course:
 * nothing on that page is stored. The absence is decided before this component
 * is reached, so there is no flag here to get wrong.
 */
export default function PauseAnswer({
  pageSlug,
  label,
  hint,
  saved,
}: {
  pageSlug: string;
  label: string;
  /** "Use initials only." on Lesson 14, whose page asks for people. */
  hint?: string;
  saved: string;
}) {
  const [open, setOpen] = useState(Boolean(saved));
  const [text, setText] = useState(saved);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          {label}
        </button>
        <span className="ml-3 text-sm text-[#6B5F53]">optional</span>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-4">
      {hint && <p className="mb-2 text-sm text-[#5C5147]">{hint}</p>}
      <label htmlFor="pause-answer" className="sr-only">
        {label}
      </label>
      <textarea
        id="pause-answer"
        rows={4}
        maxLength={FIELD_LIMIT}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSavedAt(null);
        }}
        className="w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await saveToolRows(pageSlug, "P", [[text]]);
                setSavedAt(Date.now());
                setError(null);
              } catch {
                setError("That could not be saved. Please try again.");
              }
            })
          }
          className="rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Close
        </button>
        {savedAt && !pending && <span className="text-sm text-[#6B5F53]">Saved.</span>}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">
        This saves to your account and is shown nowhere else.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </div>
  );
}
