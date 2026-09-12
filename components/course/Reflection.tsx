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
    <section className="mt-16 border-t border-[#E5D9C7] pt-10">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Reflection
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
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
              className="block text-lg leading-snug text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {prompt}
            </label>
            <textarea
              id={`answer-${i}`}
              name={`answer-${i}`}
              rows={5}
              defaultValue={saved[i] ?? ""}
              className="mt-3 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm leading-relaxed text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
              placeholder="Write as much or as little as you like."
            />
          </div>
        ))}

        {state.error && (
          <p
            role="alert"
            className="rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]"
          >
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save reflection"}
          </button>
          {state.savedAt && !pending && (
            <p className="text-sm text-[#5C5147]">Saved.</p>
          )}
        </div>
      </form>
    </section>
  );
}
