"use client";

/**
 * A way off this page in one press.
 *
 * It uses location.replace rather than a link, so this page is taken out of the
 * browser's back history instead of being left one press behind. That is all it
 * can honestly do: the pages visited before it remain, and monitoring software
 * on the device is unaffected. The note beside it says so, because a button that
 * implies more safety than it delivers is worse than no button.
 *
 * It is the first thing on the page and the first thing a keyboard reaches.
 */
export default function TbymQuickExit({
  label,
  note,
}: {
  label: string;
  note: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={() => window.location.replace("https://www.bbc.co.uk/weather")}
        className="inline-flex items-center justify-center rounded-md bg-[var(--tb-btn)] px-6 py-3 text-[17px] font-medium text-[var(--tb-btn-ink)]"
      >
        {label}
      </button>
      <span className="text-[13px] leading-relaxed text-[var(--tb-mute)]">
        {note}
      </span>
    </div>
  );
}
