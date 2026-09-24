"use client";

import { useState, useTransition } from "react";

import { saveLessonQuestions } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import type { LessonQuestion } from "@/lib/mind-slides";

/**
 * One or two optional prompts at the end of a lesson.
 *
 * Not a test, and no longer shaped like one. An earlier draft asked ten
 * questions with Scripture blanks, true-or-false and an answer to reveal; it
 * read as marking, which is not what the end of a lesson about a restless mind
 * should feel like. What is left is somewhere to write, if writing helps.
 *
 * Nothing is scored, required or counted, and the lesson finishes whether or
 * not a word is typed here.
 *
 * On what is claimed about privacy: these go to the member's own row, and row
 * level security scopes every read in the course to the member who wrote them.
 * No page, admin screen or export in this codebase reads them back — the
 * privacy suite holds that. What cannot honestly be said is that nobody else
 * *could* ever read them: the text is stored in an ordinary column, and whoever
 * administers the database can reach it. So the wording below says what is
 * true — it is not shown to anyone and not used for anything — rather than
 * promising a secrecy the storage does not provide.
 */
export default function LessonQuestions({
  lessonSlug,
  intro,
  questions,
  saved,
}: {
  lessonSlug: string;
  intro: string;
  questions: LessonQuestion[];
  saved: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(saved);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await saveLessonQuestions(lessonSlug, answers);
        setState("saved");
      } catch {
        setState("error");
      }
    });
  }

  return (
    <section className="mt-12">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Let it settle
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">{intro}</p>

      <div className="mt-6 space-y-6">
        {questions.map((q) => (
          <div key={q.id}>
            <label
              htmlFor={`q-${q.id}`}
              className="block text-[15px] leading-relaxed text-[#2B2118]"
            >
              {q.prompt}
            </label>
            <textarea
              id={`q-${q.id}`}
              value={answers[q.id] ?? ""}
              onChange={(e) => {
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }));
                setState("idle");
              }}
              rows={3}
              className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#2B2118] focus:border-[#8B5E34] focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-sm border border-[#D9CDBA] bg-white px-4 py-2 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          {pending ? "Saving…" : "Save my private reflection"}
        </button>
        {state === "saved" && (
          <span className="text-sm text-[#6B5F53]">
            Saved. It is not shown to anyone in the course and is not used to
            measure anything.
          </span>
        )}
        {state === "error" && (
          <span role="alert" className="text-sm text-[#8B3A2E]">
            That did not save. Your words are still here on the page.
          </span>
        )}
      </div>
    </section>
  );
}
