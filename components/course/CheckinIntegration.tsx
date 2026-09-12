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
    <section className="mt-16 border-t border-[#E5D9C7] pt-10">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {checkin.title}
      </h2>
      {checkin.intro && (
        <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">{checkin.intro}</p>
      )}
      {checkin.blank_note && (
        <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">{checkin.blank_note}</p>
      )}

      <div className="mt-8 space-y-7">
        {items.map((item) => (
          <div key={item.id}>
            <label
              htmlFor={`item-${item.id}`}
              className="block text-lg leading-snug text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {item.label}
              {item.optional && (
                <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
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
              className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm leading-relaxed text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
            />
          </div>
        ))}

        {checkin.reflection_prompt && (
          <div>
            <label
              htmlFor="integration-reflection"
              className="block text-lg leading-snug text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {checkin.reflection_prompt}
            </label>
            <textarea
              id="integration-reflection"
              rows={6}
              value={values.reflection ?? ""}
              onChange={(e) => setValues((p) => ({ ...p, reflection: e.target.value }))}
              className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm leading-relaxed text-[#2B2118] outline-none focus:border-[#8B5E34]"
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => save(confirmed)}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-6 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save my answers"}
        </button>
        {savedNote && !pending && <span className="text-sm text-[#5C5147]">Saved.</span>}
      </div>

      {checkin.confirm && (
        <label
          className={`mt-6 flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-4 text-sm leading-relaxed ${
            confirmed ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA]"
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
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
          />
          <span className="text-[#2B2118]">{checkin.confirm}</span>
        </label>
      )}

      {confirmed && checkin.closing && (
        <p
          className="mt-8 border-l-2 border-[#8B5E34] pl-6 text-lg leading-relaxed text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          {checkin.closing}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
