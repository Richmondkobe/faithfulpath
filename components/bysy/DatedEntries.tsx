"use client";

import { useState, useTransition } from "react";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { FIELD_LIMIT } from "@/lib/bysy-wording";

/**
 * A record kept over time, for §7.
 *
 * Lesson 5's sheet says it plainly: "a record to keep over time, not a form to
 * complete in one sitting. Return to it periodically as ordinary life provides
 * new evidence." So entries carry their own date and are added when something
 * happens, rather than being a grid to fill in now.
 *
 * Three things it does not do, each for a reason.
 *
 * **It never prompts.** §7 is explicit that scheduling a prompt turns
 * observation into monitoring. There is no reminder here, no notification, no
 * "you have not added anything since", and nothing anywhere schedules one — a
 * course that nudged someone to keep watching the person they are dating would
 * be teaching the habit it exists to interrupt.
 *
 * **It counts nothing.** Lesson 5 asks which windows are still empty and Lesson
 * 7 asks the learner to weigh what they have seen; both are the learner's
 * reading. A tally of nine windows filled, or of green flags observed, would be
 * the platform doing the weighing — which §2 forbids, and which §8 forbids
 * again for green flags specifically, since they are not credits that offset
 * harm.
 *
 * **It does not invite narrative.** Fields are capped, and the guidance asks
 * for what was seen or heard and when. §4 is explicit that these must not
 * accumulate evidential detail.
 *
 * The privacy note is a prop and defaults off. Lesson 5 already carries one in
 * its own page text and must not get a second; Lesson 7 is not on §4's list at
 * all. Repeating it everywhere makes the course feel unsafe rather than
 * safety-aware.
 */
export default function DatedEntries({
  pageSlug,
  part,
  saved,
  categories,
  categoryLabel = "About",
  statuses,
  evidenceLabel = "What I observed",
  guidance,
}: {
  pageSlug: string;
  part: string;
  /** Rows of [date, category, status, evidence]. */
  saved: string[][];
  /** The nine windows, the ten green flags — whatever this page observes. */
  categories?: string[];
  categoryLabel?: string;
  /** Observed / Not yet observed / Mixed evidence / Concern observed. */
  statuses?: string[];
  evidenceLabel?: string;
  guidance?: string;
}) {
  const blank = () => ["", categories ? "" : "-", statuses ? "" : "-", ""];
  const [rows, setRows] = useState<string[][]>(() =>
    saved.length > 0 ? saved : [blank()]
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

  // Newest first for reading, without reordering what is stored.
  const order = rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => (b.row[0] || "").localeCompare(a.row[0] || ""));

  return (
    <section className="mt-6">
      {guidance && (
        <p className="text-sm leading-relaxed text-[#6B5F53]">{guidance}</p>
      )}

      <ul className="mt-4 space-y-4">
        {order.map(({ row, i }) => (
          <li
            key={i}
            className="rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-4"
          >
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor={`${part}-date-${i}`}
                  className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
                >
                  Date
                </label>
                <input
                  id={`${part}-date-${i}`}
                  type="date"
                  value={row[0] ?? ""}
                  onChange={(e) => setCell(i, 0, e.target.value)}
                  className="mt-1 rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] outline-none focus:border-[#8B5E34]"
                />
              </div>

              {categories && (
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${part}-cat-${i}`}
                    className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
                  >
                    {categoryLabel}
                  </label>
                  <select
                    id={`${part}-cat-${i}`}
                    value={row[1] ?? ""}
                    onChange={(e) => setCell(i, 1, e.target.value)}
                    className="mt-1 w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] outline-none focus:border-[#8B5E34]"
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {statuses && (
                <div>
                  <label
                    htmlFor={`${part}-status-${i}`}
                    className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
                  >
                    What I would say
                  </label>
                  <select
                    id={`${part}-status-${i}`}
                    value={row[2] ?? ""}
                    onChange={(e) => setCell(i, 2, e.target.value)}
                    className="mt-1 rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] outline-none focus:border-[#8B5E34]"
                  >
                    <option value="">—</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setRows((cur) => cur.filter((_, j) => j !== i))}
                className="ml-auto text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#8B3A2E]"
              >
                Remove
              </button>
            </div>

            <label htmlFor={`${part}-note-${i}`} className="mt-3 block text-sm text-[#4A4038]">
              {evidenceLabel}
            </label>
            <textarea
              id={`${part}-note-${i}`}
              rows={2}
              maxLength={FIELD_LIMIT}
              value={row[3] ?? ""}
              onChange={(e) => setCell(i, 3, e.target.value)}
              className="mt-1 w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => setRows((cur) => [...cur, blank()])}
          className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          Add an entry
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
        Add entries when something happens, and leave this for weeks if nothing
        does. Nothing here is counted or scored, and we will never remind you to
        come back — noticing is yours to do, not a task we set you.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
