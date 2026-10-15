"use client";

import { useState, useTransition } from "react";
import { saveAcknowledgement } from "@/app/members/courses/when-your-mind-wont-rest/actions";

export type AckState = Record<string, { checked: boolean; at: string | null }>;

/**
 * The three boundaries on "When This Course Is Not Enough".
 *
 * Deliberately weak by design. It locks nothing — a member who ticks none of it
 * keeps the whole course — it is dismissible, and it reappears when they come
 * back to this page. It is never promoted into a modal over the course, because
 * a person who has come here looking for help should not first have to get past
 * a dialogue.
 *
 * Only the tick and its date are stored. This is not a safety assessment, it
 * records nothing about how anyone is, and nothing about it is monitored.
 */
export default function Acknowledgement({
  intro,
  statements,
  saved,
}: {
  intro: string;
  statements: { id: string; text: string }[];
  saved: AckState;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(statements.map((s) => [s.id, saved[s.id]?.checked ?? false]))
  );
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    const previous = checked;
    setChecked(next);
    startTransition(async () => {
      try {
        await saveAcknowledgement(next);
        setError(null);
      } catch {
        setChecked(previous);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  const acknowledgedOn = statements
    .map((s) => saved[s.id]?.at)
    .filter((at): at is string => Boolean(at))
    .sort()
    .at(-1);

  return (
    <section className="mt-10 rounded-xl border border-line bg-sand px-5 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Three boundaries
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink">{intro}</p>

      <ul className="mt-5 space-y-3">
        {statements.map((statement) => (
          <li key={statement.id}>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-navy">
              <input
                type="checkbox"
                checked={checked[statement.id] ?? false}
                disabled={pending}
                onChange={() => toggle(statement.id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-gold-text"
              />
              <span>{statement.text}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
        >
          Close this
        </button>
        {acknowledgedOn && (
          <span className="text-sm text-muted">
            Acknowledged{" "}
            {new Date(acknowledgedOn).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Nothing here is required, and none of it locks any part of the course.
        You can close this and carry on; it will be here when you come back to
        this page.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
