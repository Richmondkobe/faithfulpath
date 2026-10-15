"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Checkin } from "@/lib/checkin";
import { saveCheckin } from "@/app/members/courses/actions";

/**
 * Lesson 28, Day 30. Six fields, a dated paragraph, and a confirmation. The
 * blank note matters here: the content is explicit that an empty line is not a
 * failure, so nothing is required except the confirmation itself.
 */
export default function CheckinIntegration({
  courseSlug,
  lessonSlug,
  checkin,
  savedAnswers,
  savedConfirmed,
}: {
  courseSlug: string;
  lessonSlug: string;
  checkin: Checkin;
  savedAnswers: Record<string, string | string[]> | null;
  savedConfirmed: boolean;
}) {
  const router = useRouter();
  const items = checkin.items ?? [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const item of items) {
      const v = savedAnswers?.[item.id];
      out[item.id] = typeof v === "string" ? v : "";
    }
    const r = savedAnswers?.reflection;
    out.reflection = typeof r === "string" ? r : "";
    return out;
  });
  const [confirmed, setConfirmed] = useState(savedConfirmed);
  const [savedNote, setSavedNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(nextConfirmed: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await saveCheckin(courseSlug, lessonSlug, values, { confirmed: nextConfirmed });
        setSavedNote(true);
        router.refresh();
      } catch {
        setError("That could not be saved. Please try again.");
        setConfirmed(!nextConfirmed);
      }
    });
  }

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {checkin.title}
      </h2>
      {checkin.intro && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{checkin.intro}</p>
      )}
      {checkin.blank_note && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{checkin.blank_note}</p>
      )}

      <div className="mt-8 space-y-7">
        {items.map((item) => (
          <div key={item.id}>
            <label
              htmlFor={`item-${item.id}`}
              className="block text-lg leading-snug text-navy"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {item.label}
              {item.optional && (
                <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
                  optional
                </span>
              )}
            </label>
            <textarea
              id={`item-${item.id}`}
              rows={3}
              value={values[item.id] ?? ""}
              placeholder={item.placeholder}
              onChange={(e) =>
                setValues((p) => ({ ...p, [item.id]: e.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-field bg-white px-4 py-3 text-sm leading-relaxed text-navy outline-none placeholder:text-placeholder focus:border-gold-text"
            />
          </div>
        ))}

        {checkin.reflection_prompt && (
          <div>
            <label
              htmlFor="integration-reflection"
              className="block text-lg leading-snug text-navy"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {checkin.reflection_prompt}
            </label>
            <textarea
              id="integration-reflection"
              rows={6}
              value={values.reflection ?? ""}
              onChange={(e) => setValues((p) => ({ ...p, reflection: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-field bg-white px-4 py-3 text-sm leading-relaxed text-navy outline-none focus:border-gold-text"
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => save(confirmed)}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-6 py-3 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save my answers"}
        </button>
        {savedNote && !pending && <span className="text-sm text-muted">Saved.</span>}
      </div>

      {checkin.confirm && (
        <label
          className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 text-sm leading-relaxed ${
            confirmed ? "border-gold-text bg-sand" : "border-field"
          }`}
        >
          <input
            type="checkbox"
            checked={confirmed}
            disabled={pending}
            onChange={() => {
              const next = !confirmed;
              setConfirmed(next);
              save(next);
            }}
            className="mt-0.5 h-4 w-4 shrink-0 accent-gold-text"
          />
          <span className="text-navy">{checkin.confirm}</span>
        </label>
      )}

      {confirmed && checkin.closing && (
        <p
          className="mt-8 border-l-2 border-gold-text pl-6 text-lg leading-relaxed text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {checkin.closing}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
