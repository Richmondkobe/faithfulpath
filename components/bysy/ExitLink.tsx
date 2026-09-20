"use client";

/**
 * "Leave this page →" written into the course text, made to work.
 *
 * Six pages name the quick exit in prose, and the phrase is in the safety
 * notice at the top of Lessons 6, 9, 10, 13 and 19 — the pages most likely to
 * be open when somebody needs it. It rendered as bold text: the one instruction
 * on those pages that looked like a control and was not.
 *
 * It does what the floating control does, for the same reasons: replaces the
 * page in the same tab so the course is not what Back returns to, records
 * nothing, and claims nothing about history.
 */
const NEUTRAL_DESTINATION = "https://www.bbc.co.uk/weather";

export default function ExitLink({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.location.replace(NEUTRAL_DESTINATION)}
      className="font-medium text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
    >
      {children}
    </button>
  );
}
