"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isComplete,
  type Checkin,
  type CheckinAnswers,
  type GuidanceRule,
} from "@/lib/checkin";
import { saveCheckin } from "@/app/members/courses/actions";

// Readiness (Lesson 4) and Discernment (Lesson 24). Same shape: answer the
// sections, and the guidance rules pick one thing to say back. Nothing is
// scored and nothing is right or wrong.

function ctaHref(
  cta: NonNullable<GuidanceRule["cta"]>,
  courseSlug: string
): string {
  if (cta.resource) return `/members/courses/${courseSlug}/resources/${cta.resource}`;
  return `/members/courses/${courseSlug}/${cta.lesson ?? ""}`;
}

export default function CheckinRuleBased({
  courseSlug,
  lessonSlug,
  checkin,
  savedAnswers,
  savedOutcome,
}: {
  courseSlug: string;
  lessonSlug: string;
  checkin: Checkin;
  savedAnswers: CheckinAnswers | null;
  savedOutcome: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<CheckinAnswers>(savedAnswers ?? {});
  // Once answered, the guidance is what the member came back for, so the form
  // starts collapsed and reopens on request.
  const [editing, setEditing] = useState(!savedOutcome);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const guidance = savedOutcome
    ? (checkin.guidance ?? []).find((g) => g.id === savedOutcome) ?? null
    : null;

  const toggleMulti = (sectionId: string, optionId: string) =>
    setAnswers((prev) => {
      const current = Array.isArray(prev[sectionId]) ? (prev[sectionId] as string[]) : [];
      return {
        ...prev,
        [sectionId]: current.includes(optionId)
          ? current.filter((v) => v !== optionId)
          : [...current, optionId],
      };
    });

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await saveCheckin(courseSlug, lessonSlug, answers);
        setEditing(false);
        // The outcome can hide the way forward, so let the server re-render.
        router.refresh();
      } catch {
        setError("Your answers could not be saved. Please try again.");
      }
    });
  }

  function again() {
    setAnswers({});
    setEditing(true);
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

      {editing ? (
        <>
          <div className="mt-8 space-y-8">
            {(checkin.sections ?? []).map((section) => (
              <fieldset key={section.id}>
                <legend className="text-lg leading-snug text-[#2B2118]">
                  {section.question}
                </legend>
                <div className="mt-3 space-y-2">
                  {section.options.map((option) => {
                    const chosen =
                      section.type === "multi"
                        ? (Array.isArray(answers[section.id]) ? (answers[section.id] as string[]) : []).includes(option.id)
                        : answers[section.id] === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed transition-colors ${
                          chosen ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA]"
                        }`}
                      >
                        <input
                          type={section.type === "multi" ? "checkbox" : "radio"}
                          name={`${lessonSlug}-${section.id}`}
                          checked={chosen}
                          onChange={() =>
                            section.type === "multi"
                              ? toggleMulti(section.id, option.id)
                              : setAnswers((p) => ({ ...p, [section.id]: option.id }))
                          }
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
                        />
                        <span className="text-[#2B2118]">{option.text}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-6 text-sm text-[#8B3A2E]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={pending || !isComplete(checkin, answers)}
            className="mt-8 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Saving…" : "See my guidance"}
          </button>
          {!isComplete(checkin, answers) && (
            <p className="mt-3 text-sm text-[#6B5F53]">
              Answer each question to see your guidance.
            </p>
          )}
        </>
      ) : (
        guidance && (
          <div
            className={`mt-8 rounded-sm border px-5 py-5 ${
              guidance.block_continue || guidance.replace_primary
                ? "border-[#C98A7E] bg-[#FBF1EF]"
                : "border-[#E5D9C7] bg-[#F3EADC]"
            }`}
          >
            <h3
              className="text-xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {guidance.heading}
            </h3>
            <p className="mt-3 leading-relaxed text-[#4A4038]">{guidance.text}</p>

            {guidance.cta && (
              <Link
                href={ctaHref(guidance.cta, courseSlug)}
                className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
              >
                {guidance.cta.text}
              </Link>
            )}

            <div className="mt-5 flex flex-wrap gap-5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                Change my answers
              </button>
              {checkin.repeatable && (
                <button
                  type="button"
                  onClick={again}
                  className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  Check another direction
                </button>
              )}
            </div>
          </div>
        )
      )}
    </section>
  );
}
