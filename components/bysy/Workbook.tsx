"use client";

import { useState, useTransition } from "react";
import { saveToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { FIELD_LIMIT } from "@/lib/bysy-wording";
import SafetyCheck from "@/components/bysy/SafetyCheck";
import type { Screen } from "@/lib/bysy-types";

/**
 * "Go deeper" — the optional workbook, to addendum §5.
 *
 * Hidden until the learner taps Open the workbook, then one screen at a time.
 * The screens are the page's own, parsed from it rather than retyped, so the
 * workbook cannot come to ask something the lesson does not say.
 *
 * Three things it does not do, each because the addendum says so twice.
 *
 * **Nothing is scored, counted, totalled or summarised.** Not the Yes/Partly
 * answers, not the number of screens done, not anything. A screen that reads
 * back "4 of 5 seen" would be the platform forming a view about somebody's
 * relationship, which is the one thing this course refuses to do.
 *
 * **Nothing is prompted.** Saving and returning is supported over days or
 * weeks, and there is no nudge to finish, no reminder, and no indication that
 * an unfinished workbook is a problem.
 *
 * **A non-saved screen has no Save.** Where a screen is marked non-saved its
 * answers live in this component and nowhere else — not stored, not reflected,
 * not recalled later. That is a property of the screen, passed in, because the
 * page's implementation note is what decides it.
 */
export default function Workbook({
  pageSlug,
  screens,
  saved,
  nonSaved = [],
  readOnly = [],
  guides = [],
  safety = [],
  openingNote,
  rendered,
  renderedAfter,
  renderedInstructions,
}: {
  pageSlug: string;
  screens: Screen[];
  /** What is already stored, keyed by screen number. */
  saved: Record<number, string[][]>;
  /** Screens whose answers must never be stored. */
  nonSaved?: number[];
  /** Screens with no input fields at all. */
  readOnly?: number[];
  /** Conversation guides, which carry §6.2's gate. */
  guides?: number[];
  /** Screens where any Yes shows the specialist route at once. */
  safety?: number[];
  /**
   * Each screen's prose, already rendered. It arrives as nodes rather than as a
   * render function: a function cannot cross the server/client boundary, and
   * markdown rendering belongs on the server anyway.
   */
  /** The workbook's own opening note, shown on its first screen. */
  openingNote: React.ReactNode | null;
  rendered: Record<number, React.ReactNode>;
  /** Prose that follows the questions, rendered after the answer boxes. */
  renderedAfter: Record<number, React.ReactNode>;
  /** "How to answer", above the first screen it applies to. */
  renderedInstructions: Record<number, React.ReactNode>;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [rows, setRows] = useState<Record<number, string[][]>>(() => {
    const start: Record<number, string[][]> = {};
    for (const s of screens) {
      const slots =
        s.kind === "tick"
          ? s.ticks
          : s.kind === "sort"
            ? s.categories
            : s.kind === "choose"
              ? [""]
              : s.prompts.length > 0
                ? s.prompts
                : [""];
      start[s.n] = slots.map((_, i) => saved[s.n]?.[i] ?? ["", ""]);
    }
    return start;
  });
  // Raised by a safety check when its route is on screen. Nothing is locked:
  // "Go back to the questions" is still there for a Yes marked by mistake, and
  // Back still works. What goes is the invitation to carry on past it.
  const [safetyRouteShown, setSafetyRouteShown] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-6 py-4 text-[15px] text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          Open the workbook
        </button>
        <p className="mt-2 text-sm text-[#6B5F53]">
          Optional, and longer. It keeps your place if you leave it.
        </p>
      </div>
    );
  }

  const screen = screens[at];
  const isReadOnly = readOnly.includes(screen.n);
  const isNonSaved = nonSaved.includes(screen.n);
  const isGuide = guides.includes(screen.n);
  const isSafety = safety.includes(screen.n);
  const prompts = screen.prompts.length > 0 ? screen.prompts : [""];
  const entries = screen.repeats
    ? Math.max(1, Math.ceil((rows[screen.n]?.length ?? prompts.length) / prompts.length))
    : 1;
  const wantsNote = /\bwrite\b|\bnote\b|\bdate\b/i.test(screen.title + " " + (screen.after ?? ""));

  function setCell(row: number, col: number, value: string) {
    setRows((cur) => ({
      ...cur,
      [screen.n]: (cur[screen.n] ?? []).map((r, i) =>
        i === row ? r.map((v, j) => (j === col ? value : v)) : r
      ),
    }));
    setSavedAt(null);
  }

  function save() {
    startTransition(async () => {
      try {
        await saveToolRows(pageSlug, `W${screen.n}`, rows[screen.n] ?? []);
        setSavedAt(Date.now());
        setError(null);
      } catch {
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-8 rounded-sm border border-[#D9CDBA]">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#E5D9C7] bg-[#F7F1E6] px-5 py-3">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          {screen.group ?? "Go deeper"} · Screen {screen.n} of{" "}
          {screens[screens.length - 1].n}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Close the workbook
        </button>
      </div>

      <div className="px-5 py-5">
        <h4
          className="text-xl text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {screen.title}
        </h4>

        {at === 0 && openingNote && (
          <div className="mb-4 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
            {openingNote}
          </div>
        )}

        {renderedInstructions[screen.n]}

        {rendered[screen.n]}

        {isGuide && (
          <div className="mt-4 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-4 py-4">
            <h5 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              Before you use this together
            </h5>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
              Use this only if you can both speak freely and safely — if either
              of you could not disagree, say <em>not yet</em>, or ask someone
              else for advice without fearing what would follow, this is not the
              right tool. Seek individual guidance first.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
              This is a guide for talking, not a form. Nothing here is saved,
              there is nowhere for the other person to write, and they have no
              access to your account.
            </p>
          </div>
        )}

        {isNonSaved && !isGuide && (
          <p className="mt-4 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
            Nothing on this screen is saved. What you write here stays on this
            screen for now and is gone when you leave it.
          </p>
        )}

        {!isSafety && !isGuide && !isReadOnly && screen.kind === "tick" && (
          <ul className="mt-5 space-y-2">
            {screen.ticks.map((item, i) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#E5D9C7] px-4 py-3 text-sm leading-relaxed text-[#2B2118]">
                  <input
                    type="checkbox"
                    checked={(rows[screen.n]?.[i]?.[0] ?? "") === item}
                    onChange={(e) => setCell(i, 0, e.target.checked ? item : "")}
                    className="mt-1 h-4 w-4 accent-[#8B5E34]"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {isSafety && (
          <SafetyCheck
            items={screen.prompts}
            route={renderedAfter[screen.n]}
            routeOptions={screen.categories}
            onRoute={setSafetyRouteShown}
          />
        )}

        {isGuide && screen.prompts.length > 0 && (
          <ol className="mt-5 space-y-3">
            {screen.prompts.map((prompt, i) => (
              <li
                key={i}
                className="rounded-sm border border-[#E5D9C7] px-4 py-3 text-sm leading-relaxed text-[#2B2118]"
              >
                {prompt}
              </li>
            ))}
          </ol>
        )}

        {!isSafety && !isGuide && !isReadOnly && screen.kind === "sort" && (
          <div className="mt-5 space-y-4">
            {screen.categories.map((category, i) => (
              <div key={category} className="rounded-sm border border-[#E5D9C7] px-4 py-4">
                <label
                  htmlFor={`${screen.n}-sort-${i}`}
                  className="block text-sm font-medium text-[#2B2118]"
                >
                  {category}
                </label>
                <textarea
                  id={`${screen.n}-sort-${i}`}
                  rows={3}
                  maxLength={FIELD_LIMIT}
                  value={rows[screen.n]?.[i]?.[1] ?? ""}
                  onChange={(e) => setCell(i, 1, e.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
                />
              </div>
            ))}
          </div>
        )}

        {!isSafety && !isGuide && !isReadOnly && screen.kind === "choose" && (
          <div className="mt-5 space-y-2">
            {screen.categories.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#E5D9C7] px-4 py-3 text-sm leading-relaxed text-[#2B2118]"
              >
                <input
                  type="radio"
                  name={`screen-${screen.n}`}
                  checked={(rows[screen.n]?.[0]?.[0] ?? "") === option}
                  onChange={() => setCell(0, 0, option)}
                  className="mt-1 h-4 w-4 accent-[#8B5E34]"
                />
                <span>{option}</span>
              </label>
            ))}
            {wantsNote && (
              <textarea
                rows={2}
                maxLength={FIELD_LIMIT}
                aria-label="A note, if you want one"
                value={rows[screen.n]?.[0]?.[1] ?? ""}
                onChange={(e) => setCell(0, 1, e.target.value)}
                className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
              />
            )}
          </div>
        )}

        {!isSafety &&
          !isGuide &&
          !isReadOnly &&
          screen.kind !== "read" &&
          screen.kind !== "tick" &&
          screen.kind !== "sort" &&
          screen.kind !== "choose" && (
          <div className="mt-5 space-y-4">
            {Array.from({ length: entries }).flatMap((_, e) =>
              prompts.map((prompt, j) => {
                const i = e * prompts.length + j;
                return (
              <div key={i} className="rounded-sm border border-[#E5D9C7] px-4 py-4">
                {screen.repeats && j === 0 && (
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                    Entry {e + 1}
                  </p>
                )}
                {prompt && (
                  <label
                    htmlFor={screen.example ? `${screen.n}-${i}` : undefined}
                    className="block text-sm leading-relaxed text-[#2B2118]"
                  >
                    {prompt}
                  </label>
                )}
                <div className="mt-2 flex flex-wrap items-start gap-3">
                  {screen.options.length > 0 && (
                    <select
                      id={screen.example ? undefined : `${screen.n}-${i}`}
                      aria-label={`Your answer to: ${prompt || screen.title}`}
                      value={rows[screen.n]?.[i]?.[0] ?? ""}
                      onChange={(e) => setCell(i, 0, e.target.value)}
                      className="rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] outline-none focus:border-[#8B5E34]"
                    >
                      <option value="">—</option>
                      {screen.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}
                  {screen.example && (
                    <textarea
                      id={`${screen.n}-${i}`}
                      rows={2}
                      maxLength={FIELD_LIMIT}
                      placeholder={screen.options.length > 0 ? "One short example" : ""}
                      value={rows[screen.n]?.[i]?.[1] ?? ""}
                      onChange={(e) => setCell(i, 1, e.target.value)}
                      className="min-w-0 flex-1 rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
                    />
                  )}
                </div>
              </div>
                );
              })
            )}

            {screen.repeats && (
              <button
                type="button"
                onClick={() =>
                  setRows((cur) => ({
                    ...cur,
                    [screen.n]: [
                      ...(cur[screen.n] ?? []),
                      ...prompts.map(() => ["", ""]),
                    ],
                  }))
                }
                className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
              >
                Add another
              </button>
            )}
          </div>
        )}

        {!isSafety && renderedAfter[screen.n]}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={at === 0}
            onClick={() => {
              setSafetyRouteShown(false);
              setAt((i) => Math.max(0, i - 1));
            }}
            className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] disabled:opacity-40"
          >
            Back
          </button>

          {!isSafety && !isGuide && !isReadOnly && !isNonSaved && screen.kind !== "read" && (
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          )}

          {!safetyRouteShown && (
            <button
              type="button"
              disabled={at === screens.length - 1}
              onClick={() => setAt((i) => Math.min(screens.length - 1, i + 1))}
              className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] disabled:opacity-40"
            >
              Next screen
            </button>
          )}

          {savedAt && !pending && <span className="text-sm text-[#6B5F53]">Saved.</span>}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
          Nothing here is counted or scored. Leave it whenever you like — we will
          not remind you to come back.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
