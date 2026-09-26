"use client";

import Link from "next/link";
import { useId, useState } from "react";

/**
 * The safety acknowledgement, and the way into Lesson 1 behind it.
 *
 * The build brief requires the tick before "Begin Lesson 1" appears. It is a
 * checkbox and nothing more: it is not sent anywhere, not written to
 * course_progress, and not kept in the browser. Ticking it reveals the buttons;
 * leaving the page forgets it.
 *
 * That means a learner who comes back to this page ticks again, which is the
 * right trade. The alternative is remembering something about a person in order
 * to save them one click, on a page whose whole subject is what this course
 * does and does not keep — and it would make the privacy section above it
 * untrue.
 *
 * The actions are revealed rather than enabled, because a disabled button that
 * a learner cannot press and cannot explain is worse than one that is not there
 * yet. "Stop here for today" marks nothing.
 */
export default function TbymAcknowledgement({
  acknowledgement,
  beginLabel,
  beginHref,
  stopHref,
}: {
  acknowledgement: string;
  beginLabel: string;
  beginHref: string;
  /** Where "Stop here for today" goes. It records nothing on the way. */
  stopHref: string;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const id = useId();

  return (
    <div>
      <div className="flex items-start gap-3 rounded-md border border-[var(--tb-line)] bg-[var(--tb-bg)] p-4">
        <input
          id={id}
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-1 h-5 w-5 flex-none accent-[var(--tb-accent)]"
        />
        <label htmlFor={id} className="text-[17px] leading-relaxed text-[var(--tb-ink)]">
          {acknowledgement}
        </label>
      </div>

      {acknowledged && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href={beginHref}
            className="inline-flex items-center justify-center rounded-md bg-[var(--tb-btn)] px-7 py-4 text-[17px] font-medium text-[var(--tb-btn-ink)]"
          >
            {beginLabel}
          </Link>
          <Link
            href={stopHref}
            className="inline-flex items-center justify-center rounded-md border border-[var(--tb-ink)] px-7 py-4 text-[17px] text-[var(--tb-ink)]"
          >
            Stop here for today
          </Link>
          <span
            className="rounded-sm border border-dashed border-[var(--tb-accent)] px-3 py-2 text-[13px] text-[var(--tb-mute)]"
            style={{ fontFamily: "var(--font-tbym-mono)" }}
          >
            Visit Safety and Support — page not built yet
          </span>
        </div>
      )}
    </div>
  );
}
