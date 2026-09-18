"use client";

import { useState, useTransition } from "react";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { FIELD_LIMIT, MONITORING_NOTE } from "@/lib/bysy-wording";

/**
 * The private half of a joint tool, for §5.
 *
 * One area per row, one prompt per column. It saves to the account of whoever
 * is signed in and to nobody else, which is the whole of what §5 means by "the
 * tool saves to one account": there is no second account to write to, no
 * invitation, no shared link, and no field anywhere that asks who the other
 * person is.
 *
 * The copy carries that too, because an interface can imply access without ever
 * claiming it. A worksheet that says "their boundary" beside a box the learner
 * fills in themselves is the learner's record of what they heard — not the
 * other person's entry — and the note under the form says so plainly, so nobody
 * completes it believing the other person will see it, or that what they write
 * about the other person is being collected from them.
 *
 * Nothing here is exportable: `lib/bysy-export-policy.ts` names every one of
 * these parts, and the allowlist it checks against is empty.
 */
export default function PrivateWorksheet({
  pageSlug,
  part,
  areas,
  prompts,
  saved,
  guidance,
  showMonitoringNote = false,
  rowLabel = "Area",
  ownership = "private",
}: {
  pageSlug: string;
  part: string;
  /** The six boundary areas, the seven areas of life — whatever this page works through. */
  areas: string[];
  /** The prompts repeated for each area, in the page's own order and wording. */
  prompts: string[];
  saved: string[][];
  guidance?: string;
  /** §4 lists the pages this belongs on; it is not shown beside every box. */
  showMonitoringNote?: boolean;
  rowLabel?: string;
  /** A shared record is still one account's record — the footer says which. */
  ownership?: "private" | "shared";
}) {
  const [rows, setRows] = useState<string[][]>(() =>
    areas.map((_, i) => prompts.map((_, j) => saved[i]?.[j] ?? ""))
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
    <section className="mt-6">
      {showMonitoringNote && (
        <p className="rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
          <strong className="font-medium text-[#2B2118]">Privacy and safety.</strong>{" "}
          {MONITORING_NOTE}
        </p>
      )}

      {guidance && <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">{guidance}</p>}

      <div className="mt-4 space-y-5">
        {areas.map((area, r) => (
          <fieldset
            key={area}
            className="rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-4"
          >
            <legend className="px-1 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              {rowLabel} · {area}
            </legend>
            <div className="space-y-3">
              {prompts.map((prompt, c) => (
                <div key={prompt}>
                  <label
                    htmlFor={`${part}-${r}-${c}`}
                    className="block text-sm leading-relaxed text-[#4A4038]"
                  >
                    {prompt}
                  </label>
                  <textarea
                    id={`${part}-${r}-${c}`}
                    rows={2}
                    maxLength={FIELD_LIMIT}
                    value={rows[r]?.[c] ?? ""}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    className="mt-1 w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {savedAt && !pending && <span className="text-sm text-[#6B5F53]">Saved.</span>}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        {ownership === "private" ? "This is yours." : "This is your record of what you agreed."}{" "}
        It saves to your account and to no one else&rsquo;s — the other person
        cannot see it, is not asked for anything, and has nothing stored here.
        Leave anything blank, and answer as briefly as you like: nothing here is
        counted or scored.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
