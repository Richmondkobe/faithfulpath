"use client";

import { useState, useTransition } from "react";
import { eraseMindEntries } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * "Delete what I have written here."
 *
 * Asks once before doing it, because it cannot be undone, and says plainly
 * what goes and what stays.
 */
export default function EraseEntries({ pageSlug }: { pageSlug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="mt-6 text-sm text-muted">
        Deleted. Reload the page to see it empty.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {confirming ? (
        <div className="rounded-xl border border-danger-line bg-danger-bg px-4 py-4">
          <p className="text-sm leading-relaxed text-danger">
            Delete everything you have written on this page? This cannot be
            undone. Whether you finished the lesson is kept; only your writing
            goes.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await eraseMindEntries(pageSlug);
                    setDone(true);
                  } catch {
                    setError("That could not be deleted. Please try again.");
                  }
                })
              }
              className="rounded-xl border border-danger px-5 py-2 text-sm text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-sm text-muted underline underline-offset-4 hover:text-navy"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-danger"
        >
          Delete what I have written here
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
