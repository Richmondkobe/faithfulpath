"use client";

import { useActionState } from "react";
import { saveReflections, type SaveState } from "@/app/members/courses/actions";

const initial: SaveState = { error: null, savedAt: null };

export default function Reflection({
  courseSlug,
  lessonSlug,
  prompts,
  saved,
}: {
  courseSlug: string;
  lessonSlug: string;
  prompts: string[];
  saved: Record<number, string>;
}) {
  const [state, action, pending] = useActionState(saveReflections, initial);

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Reflection
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Your answers are for your personal reflection. They are saved to your
        account, are not monitored in real time, and will be here when you come
        back.
      </p>

      <form action={action} className="mt-8 space-y-8">
        <input type="hidden" name="courseSlug" value={courseSlug} />
        <input type="hidden" name="lessonSlug" value={lessonSlug} />

        {prompts.map((prompt, i) => (
          <div key={i}>
            <label
              htmlFor={`answer-${i}`}
              className="block text-lg leading-snug text-navy"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {prompt}
            </label>
            <textarea
              id={`answer-${i}`}
              name={`answer-${i}`}
              rows={5}
              defaultValue={saved[i] ?? ""}
              className="mt-3 w-full rounded-xl border border-field bg-white px-4 py-3 text-sm leading-relaxed text-navy outline-none placeholder:text-placeholder focus:border-gold-text"
              placeholder="Write as much or as little as you like."
            />
          </div>
        ))}

        {state.error && (
          <p
            role="alert"
            className="rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger"
          >
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save reflection"}
          </button>
          {state.savedAt && !pending && (
            <p className="text-sm text-muted">Saved.</p>
          )}
        </div>
      </form>
    </section>
  );
}
