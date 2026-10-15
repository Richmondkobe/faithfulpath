"use client";

import { useState, useTransition } from "react";
import { markLessonComplete } from "@/app/members/courses/actions";

export default function MarkComplete({
  courseSlug,
  lessonSlug,
  completed,
}: {
  courseSlug: string;
  lessonSlug: string;
  completed: boolean;
}) {
  const [done, setDone] = useState(completed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted">
        <span aria-hidden="true" className="text-gold-text">
          ✓
        </span>
        Lesson complete
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await markLessonComplete(courseSlug, lessonSlug);
              setDone(true);
              setError(null);
            } catch {
              setError("Could not save that just now. Please try again.");
            }
          })
        }
        className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark lesson complete"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
