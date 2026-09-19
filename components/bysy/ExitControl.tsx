"use client";

import { useState } from "react";

/**
 * "Leave this page" — the persistent exit control, to build notes §3.
 *
 * It stays visible while the learner scrolls, leaves the course immediately in
 * the same tab, and goes to a neutral page that says nothing about why someone
 * arrived there.
 *
 * Three things it deliberately does not do:
 *
 * It records nothing. No analytics event, no progress write, no server call of
 * any kind — §3 is explicit that a generic label is not enough, because the
 * page data attached to an event can disclose the destination or the action by
 * itself. So there is no event to label.
 *
 * It claims nothing about history. `location.replace` means the course page is
 * not what the Back button returns to, which is a real difference and worth
 * having — but it does not remove anything already written to browser, network
 * or account history, and the note says so plainly. Someone deciding whether it
 * is safe to press this needs the truth about what it does.
 *
 * It does not open a new tab. A new tab leaves the course still open behind it.
 *
 * ---
 *
 * On its size, which is a safety question rather than a layout one.
 *
 * This began as a bordered panel holding a full-width black button and two
 * permanent lines about being monitored. On a phone it covered the content it
 * was fixed above — on the course home, the question the page opens with and
 * the first way in — and it did that on every page, for everyone.
 *
 * It was also the most conspicuous thing on the screen. A panel reading "leave
 * this page" and "someone who monitors this device" announces to anyone glancing
 * over a reader's shoulder exactly what kind of page they are on, which is the
 * situation the control exists for. Discretion is the safer default here, as
 * long as it stays easy to find: a small muted pill in the corner reads as
 * ordinary furniture, and the phrase on it is the one the course text uses when
 * it points here.
 *
 * The note is still there, and it is still true; it appears on hover, on
 * keyboard focus, or on tapping the quiet ⓘ beside the button, rather than
 * sitting on the page permanently. It is in the document at all times for
 * screen readers, hidden visually rather than conditionally rendered, so
 * nobody is told less about what this does than anybody else.
 *
 * Leaving stays one action. The button never becomes a disclosure step to get
 * through first — the worst moment to add a tap is the moment somebody needs
 * this. A mis-tap on the ⓘ costs a second; a mis-tap on the button leaves,
 * which is the harmless direction to be wrong in.
 */
const NEUTRAL_DESTINATION = "https://www.bbc.co.uk/weather";

const NOTE =
  "This does not erase your browsing history. Someone who monitors this device may still be able to see it.";

export default function ExitControl() {
  const [showNote, setShowNote] = useState(false);

  function leave() {
    // replace, not assign: the course does not become the Back target.
    window.location.replace(NEUTRAL_DESTINATION);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-3 pb-3 sm:px-5 sm:pb-5">
      <div
        className="pointer-events-auto flex max-w-[15rem] flex-col items-end"
        onMouseEnter={() => setShowNote(true)}
        onMouseLeave={() => setShowNote(false)}
      >
        <p
          id="exit-note"
          className={
            showNote
              ? "mb-2 rounded-sm border border-[#E5D9C7] bg-[#FDFAF4] px-3 py-2 text-right text-[12px] leading-snug text-[#5C5147] shadow-[0_2px_10px_rgba(43,33,24,0.12)]"
              : "sr-only"
          }
        >
          {NOTE}
        </p>

        <div className="flex items-stretch overflow-hidden rounded-full border border-[#D9CDBA] bg-[#FDFAF4] shadow-[0_1px_6px_rgba(43,33,24,0.10)]">
          <button
            type="button"
            onClick={leave}
            onFocus={() => setShowNote(true)}
            onBlur={() => setShowNote(false)}
            aria-describedby="exit-note"
            className="px-4 py-2 text-[13px] font-medium text-[#2B2118] transition-colors hover:bg-[#F3EADC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5E34]"
          >
            Leave this page
          </button>
          <button
            type="button"
            onClick={() => setShowNote((open) => !open)}
            onFocus={() => setShowNote(true)}
            aria-expanded={showNote}
            aria-controls="exit-note"
            aria-label="What leaving does and does not do"
            className="border-l border-[#E5D9C7] px-2.5 text-[12px] text-[#6B5F53] transition-colors hover:bg-[#F3EADC] hover:text-[#2B2118] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5E34]"
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
