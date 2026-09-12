"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Checkin } from "@/lib/checkin";
import { saveCheckin } from "@/app/members/courses/actions";

/**
 * Lesson 5. An agreement rather than a questionnaire: every statement, a chosen
 * path, and the final confirmation. The confirm box stays disabled until the
 * rest is done, because ticking it is the point of the exercise.
 */
export default function CheckinSafety({
  courseSlug,
  lessonSlug,
  checkin,
  savedAnswers,
  savedPath,
  savedConfirmed,
}: {
  courseSlug: string;
  lessonSlug: string;
  checkin: Checkin;
  savedAnswers: Record<string, string | string[]> | null;
  savedPath: string | null;
  savedConfirmed: boolean;
}) {
  const router = useRouter();
  const statements = checkin.statements ?? [];
  const [ticked, setTicked] = useState<boolean[]>(() => {
    const saved = savedAnswers?.statements;
    return statements.map((_, i) =>
      Array.isArray(saved) ? saved.includes(String(i)) : false
    );
  });
  const [path, setPath] = useState<string | null>(savedPath);
  const [confirmed, setConfirmed] = useState(savedConfirmed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allTicked = ticked.every(Boolean);
  const ready = allTicked && Boolean(path);

  function save(nextConfirmed: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await saveCheckin(
          courseSlug,
          lessonSlug,
          { statements: ticked.map((v, i) => (v ? String(i) : "")).filter(Boolean), path: path ?? "" },
          { path, confirmed: nextConfirmed }
        );
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

      <ul className="mt-8 space-y-2">
        {statements.map((statement, i) => (
          <li key={i}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed transition-colors ${
                ticked[i] ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA]"
              }`}
            >
              <input
                type="checkbox"
                checked={ticked[i]}
                onChange={() =>
                  setTicked((prev) => prev.map((v, j) => (j === i ? !v : v)))
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
              />
              <span className="text-[#2B2118]">{statement}</span>
            </label>
          </li>
        ))}
      </ul>

      {checkin.path && (
        <fieldset className="mt-8">
          <legend className="text-lg leading-snug text-[#2B2118]">
            {checkin.path.question}
          </legend>
          <div className="mt-3 space-y-2">
            {checkin.path.options.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed transition-colors ${
                  path === option.id ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA]"
                }`}
              >
                <input
                  type="radio"
                  name={`${lessonSlug}-path`}
                  checked={path === option.id}
                  onChange={() => setPath(option.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
                />
                <span className="text-[#2B2118]">{option.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {checkin.confirm && (
        <label
          className={`mt-8 flex items-start gap-3 rounded-sm border px-4 py-4 text-sm leading-relaxed ${
            confirmed ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA]"
          } ${ready ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
        >
          <input
            type="checkbox"
            checked={confirmed}
            disabled={!ready || pending}
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

      {!ready && (
        <p className="mt-3 text-sm text-[#6B5F53]">
          Confirm every statement and choose a path before you tick this.
        </p>
      )}
      {confirmed && !pending && (
        <p className="mt-3 text-sm text-[#5C5147]">Saved.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}

      {checkin.help_link?.lesson && (
        <p className="mt-6 text-sm">
          <Link
            href={`/members/courses/${courseSlug}/${checkin.help_link.lesson}`}
            className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            {checkin.help_link.text}
          </Link>
        </p>
      )}
    </section>
  );
}
