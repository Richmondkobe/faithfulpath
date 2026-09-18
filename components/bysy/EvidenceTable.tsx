"use client";

import { useState, useTransition } from "react";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { FIELD_LIMIT, MONITORING_NOTE } from "@/lib/bysy-wording";

/**
 * A table the learner adds rows to, for §7.
 *
 * §7 asks that evidence-recording sections let the learner add rows rather than
 * offering a fixed number. A fixed three says, without meaning to, that three
 * is the expected quantity — too few and the tool looks full, too many and an
 * honest short answer looks like a failure to fill it in.
 *
 * Two things it deliberately does not do:
 *
 * It counts nothing. Lesson 4 asks "which column is longer?" and that is the
 * learner's comparison to make. A number rendered next to each column would be
 * the platform doing the weighing, which §2 forbids — and a count is a score
 * however carefully it is worded.
 *
 * It does not invite narrative. Each field is capped, and the guidance asks for
 * what was seen or heard and when, not for the story around it. §4 is explicit
 * that these must not become repositories of evidential material: a learner
 * whose account is read should not have written the case against someone into
 * it.
 */
export default function EvidenceTable({
  pageSlug,
  part,
  columns,
  saved,
  guidance,
  showMonitoringNote = false,
  startingRows = 3,
}: {
  pageSlug: string;
  part: string;
  columns: string[];
  saved: string[][];
  guidance?: string;
  /** §4 lists the pages this belongs on; it is not shown beside every box. */
  showMonitoringNote?: boolean;
  startingRows?: number;
}) {
  const blank = () => columns.map(() => "");
  const [rows, setRows] = useState<string[][]>(() =>
    saved.length > 0 ? saved : Array.from({ length: startingRows }, blank)
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setCell(r: number, c: number, value: string) {
    setRows((current) =>
      current.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row))
    );
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

      {guidance && (
        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">{guidance}</p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="border-b border-[#D9CDBA] px-2 py-2 text-left align-bottom font-medium text-[#2B2118]"
                >
                  {c}
                </th>
              ))}
              <th scope="col" className="w-10 border-b border-[#D9CDBA]">
                <span className="sr-only">Remove row</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border-b border-[#E5D9C7] px-1 py-1 align-top">
                    <label className="sr-only" htmlFor={`${part}-${r}-${c}`}>
                      {columns[c]}, row {r + 1}
                    </label>
                    <textarea
                      id={`${part}-${r}-${c}`}
                      rows={2}
                      maxLength={FIELD_LIMIT}
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className="w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
                    />
                  </td>
                ))}
                <td className="border-b border-[#E5D9C7] px-1 py-1 align-top">
                  <button
                    type="button"
                    onClick={() => setRows((cur) => cur.filter((_, i) => i !== r))}
                    className="px-2 py-2 text-[#8B5E34] transition-colors hover:text-[#8B3A2E]"
                    aria-label={`Remove row ${r + 1}`}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => setRows((cur) => [...cur, blank()])}
          className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          Add a row
        </button>
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
        Add as many rows as you need, or leave rows blank. Nothing here is
        counted or scored, and a short answer is not a worse one.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
