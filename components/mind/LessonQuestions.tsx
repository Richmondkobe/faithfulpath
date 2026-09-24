"use client";

import { useState, useTransition } from "react";

import { saveLessonQuestions } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import type { LessonQuestion } from "@/lib/mind-slides";

/**
 * The questions that follow a lesson's slides.
 *
 * They are not a test. Nothing is marked, nothing is counted, and finishing
 * the lesson does not wait on them — which is the rule everywhere else in this
 * course and the reason they sit after the teaching rather than in front of
 * anything.
 *
 * A recall or true/false question keeps its answer hidden until the member
 * asks for it. Showing it immediately would make the page a marking scheme;
 * hiding it entirely would make it a quiz they could fail privately. This way
 * they can think, then check, in their own time.
 *
 * Reflections have no answer to reveal. They are the member's own words, kept
 * on their own row and read back to nobody.
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
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function set(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setState("idle");
  }

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

      <ol className="mt-6 space-y-7">
        {questions.map((q, i) => (
          <li key={q.id}>
            <p className="text-[15px] leading-relaxed text-[#2B2118]">
              <span className="text-[#8B5E34]">{i + 1}.</span> {q.prompt}
            </p>

            {q.kind === "true_false" ? (
              <div className="mt-3 flex gap-3">
                {["true", "false"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set(q.id, v)}
                    aria-pressed={answers[q.id] === v}
                    className={`rounded-sm border px-5 py-2 text-sm capitalize transition-colors ${
                      answers[q.id] === v
                        ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                        : "border-[#D9CDBA] text-[#5C5147] hover:border-[#8B5E34]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
                rows={q.kind === "reflection" ? 3 : 1}
                className="mt-3 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-2 text-[15px] leading-relaxed text-[#2B2118] focus:border-[#8B5E34] focus:outline-none"
              />
            )}

            {q.answer && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShown((p) => ({ ...p, [q.id]: !p[q.id] }))}
                  className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  {shown[q.id] ? "Hide what the lesson said" : "What did the lesson say?"}
                </button>
                {shown[q.id] && (
                  <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
                    {q.answer}
                    {q.note && <span className="block mt-1 text-[#6B5F53]">{q.note}</span>}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-sm border border-[#D9CDBA] bg-white px-4 py-2 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          {pending ? "Saving…" : "Save my answers"}
        </button>
        {state === "saved" && (
          <span className="text-sm text-[#6B5F53]">Saved. Only you can read these.</span>
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
