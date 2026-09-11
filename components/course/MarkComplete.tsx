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
      <p className="inline-flex items-center gap-2 text-sm text-[#5C5147]">
        <span aria-hidden="true" className="text-[#8B5E34]">
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
        className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark lesson complete"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </div>
  );
}
