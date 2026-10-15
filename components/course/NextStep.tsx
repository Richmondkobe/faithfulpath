"use client";

import { useState, useTransition } from "react";
import { setLessonComplete, saveFollowup } from "@/app/members/courses/actions";

/**
 * "Your next step". Ticking the box is what marks a teaching lesson complete —
 * the old standalone Mark-complete button is gone for these lessons, because
 * the step and the completion are the same act.
 */
export default function NextStep({
  courseSlug,
  lessonSlug,
  action,
  actionDone,
  followup,
  completed,
  savedFollowup,
}: {
  courseSlug: string;
  lessonSlug: string;
  action: string;
  actionDone: string;
  followup?: string;
  completed: boolean;
  savedFollowup: string | null;
}) {
  const [done, setDone] = useState(completed);
  const [followupValue, setFollowupValue] = useState(savedFollowup);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Your next step
      </h2>
      <p
        className="mt-4 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {action}
      </p>

      <label
        className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 text-sm leading-relaxed ${
          done ? "border-gold-text bg-sand" : "border-field"
        }`}
      >
        <input
          type="checkbox"
          checked={done}
          disabled={pending}
          onChange={() => {
            const next = !done;
            setDone(next);
            startTransition(async () => {
              try {
                await setLessonComplete(courseSlug, lessonSlug, next);
                setError(null);
              } catch {
                setDone(!next);
                setError("That could not be saved. Please try again.");
              }
            });
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-gold-text"
        />
        <span className="text-navy">{actionDone}</span>
      </label>

      {followup && (
        <div className="mt-5 rounded-xl border border-line bg-sand px-4 py-4">
          <p className="text-sm leading-relaxed text-ink">{followup}</p>
          <div className="mt-3 flex gap-3">
            {["yes", "no"].map((value) => (
              <button
                key={value}
                type="button"
                disabled={pending}
                onClick={() => {
                  setFollowupValue(value);
                  startTransition(async () => {
                    try {
                      await saveFollowup(courseSlug, lessonSlug, value);
                    } catch {
                      setError("That could not be saved. Please try again.");
                    }
                  });
                }}
                className={`rounded-xl border px-5 py-2 text-sm transition-colors ${
                  followupValue === value
                    ? "border-gold-text bg-sand text-navy"
                    : "border-field text-muted hover:border-gold-text"
                }`}
              >
                {value === "yes" ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
