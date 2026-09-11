"use client";

import { useState, useTransition } from "react";
import type { QuizQuestion } from "@/lib/course";
import { saveQuizAttempt } from "@/app/members/courses/actions";

// All questions on screen at once: these are short recall checks at the end of
// a lesson, and a member should be able to look back over the whole set before
// submitting rather than being marched through one at a time.

export default function Quiz({
  courseSlug,
  lessonSlug,
  questions,
  passMark,
  bestScore,
  alreadyPassed,
}: {
  courseSlug: string;
  lessonSlug: string;
  questions: QuizQuestion[];
  passMark: number;
  bestScore: number | null;
  alreadyPassed: boolean;
}) {
  const [picked, setPicked] = useState<(number | null)[]>(
    () => questions.map(() => null)
  );
  const [marked, setMarked] = useState(false);
  const [best, setBest] = useState<number | null>(bestScore);
  const [passedEver, setPassedEver] = useState(alreadyPassed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answeredAll = picked.every((p) => p !== null);
  const score = picked.reduce<number>(
    (n, choice, i) => (choice === questions[i].answer ? n + 1 : n),
    0
  );
  const passedNow = score >= passMark;

  function submit() {
    setMarked(true);
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveQuizAttempt(courseSlug, lessonSlug, score);
        setBest(result.best);
        setPassedEver(result.passed);
      } catch {
        setError("Your answers were marked, but the score could not be saved.");
      }
    });
  }

  function retry() {
    setPicked(questions.map(() => null));
    setMarked(false);
    setError(null);
  }

  return (
    <section className="mt-16 border-t border-[#E5D9C7] pt-10">
      <h2
        className="text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Quiz
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
        {questions.length} questions · {passMark} correct to pass
        {best !== null && ` · your best so far: ${best}/${questions.length}`}
      </p>

      <ol className="mt-8 space-y-8">
        {questions.map((question, qi) => {
          const choice = picked[qi];
          const correct = question.answer;

          return (
            <li key={qi}>
              <p className="text-lg leading-snug text-[#2B2118]">
                <span className="text-[#8B5E34]">{qi + 1}.</span> {question.q}
              </p>

              <div className="mt-3 space-y-2">
                {question.options.map((option, oi) => {
                  const isChosen = choice === oi;
                  const isAnswer = correct === oi;

                  // After marking: green on the right answer, red only on a
                  // wrong one the member actually chose.
                  let tone = "border-[#D9CDBA]";
                  if (marked && isAnswer) tone = "border-[#2C5651] bg-[#EEF4F1]";
                  else if (marked && isChosen) tone = "border-[#C98A7E] bg-[#FBF1EF]";
                  else if (isChosen) tone = "border-[#8B5E34] bg-[#F3EADC]";

                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed transition-colors ${tone}`}
                    >
                      <input
                        type="radio"
                        name={`q-${lessonSlug}-${qi}`}
                        checked={isChosen}
                        disabled={marked}
                        onChange={() =>
                          setPicked((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          })
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
                      />
                      <span className="text-[#2B2118]">{option}</span>
                      {marked && isAnswer && (
                        <span className="ml-auto shrink-0 text-[11px] uppercase tracking-[0.18em] text-[#2C5651]">
                          Correct
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {marked && (
                <p className="mt-3 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#5C5147]">
                  {choice === correct ? "Right. " : "Not quite. "}
                  {question.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="mt-6 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}

      {!marked ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={submit}
            disabled={!answeredAll}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            Submit answers
          </button>
          {!answeredAll && (
            <p className="mt-3 text-sm text-[#6B5F53]">
              Answer every question to submit.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4">
          <p className="text-lg text-[#2B2118]">
            You scored {score} out of {questions.length}.{" "}
            {passedNow ? "That is a pass." : `You need ${passMark} to pass.`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
            {pending
              ? "Saving your score…"
              : passedEver
                ? "This lesson is marked complete."
                : "Have another go — your best score is the one that is kept."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
