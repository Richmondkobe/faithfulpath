"use client";

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
 * or account history, and the note beneath the button says so plainly. Someone
 * deciding whether it is safe to press this needs the truth about what it does.
 *
 * It does not open a new tab. A new tab leaves the course still open behind it.
 */
const NEUTRAL_DESTINATION = "https://www.bbc.co.uk/weather";

export default function ExitControl() {
  function leave() {
    // replace, not assign: the course does not become the Back target.
    window.location.replace(NEUTRAL_DESTINATION);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto max-w-xs rounded-sm border border-[#D9CDBA] bg-[#FDFAF4] px-4 py-3 shadow-[0_2px_10px_rgba(43,33,24,0.12)]">
        <button
          type="button"
          onClick={leave}
          className="w-full rounded-sm bg-[#2B2118] px-5 py-3 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5E34]"
        >
          Leave this page
        </button>
        <p className="mt-2 text-[12px] leading-snug text-[#6B5F53]">
          This does not erase your browsing history. Someone who monitors this
          device may still be able to see it.
        </p>
      </div>
    </div>
  );
}
