/**
 * The lesson recording, and the state it is in before one exists.
 *
 * None of the fourteen recordings has been made. Rather than leave the section
 * out and have the page change shape later, the player is here in a disabled
 * state that says plainly why it cannot be pressed. The transcript underneath
 * it is the whole teaching in writing, so nothing is actually withheld while
 * the audio is outstanding — which is also what makes the missing recording
 * safe to ship for review.
 *
 * It renders as a real audio element the moment `src` is a signed URL.
 */
export default function TbymRecording({
  src,
  duration,
  lessonTitle,
}: {
  src: string | null;
  /** The line under the player. Provisional until the recording is made. */
  duration: string;
  lessonTitle: string;
}) {
  return (
    <div>
      {src ? (
        <audio
          controls
          preload="none"
          src={src}
          className="w-full"
          aria-label={`Recording: ${lessonTitle}`}
        >
          Your browser cannot play this recording. The full transcript is below.
        </audio>
      ) : (
        <div
          role="group"
          aria-label="Recording not yet available"
          className="flex items-center gap-4 rounded-md border border-dashed border-[var(--tb-accent)] bg-[var(--tb-bg)] p-4"
        >
          <span
            aria-hidden="true"
            className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full bg-[var(--tb-btn)] opacity-50"
          >
            <svg viewBox="0 0 20 20" className="ml-[3px] h-5 w-5 fill-[var(--tb-btn-ink)]">
              <path d="M4 2l14 8-14 8z" />
            </svg>
          </span>
          <p
            className="text-[13px] uppercase leading-relaxed tracking-[0.14em] text-[var(--tb-mute)]"
            style={{ fontFamily: "var(--font-tbym-mono)" }}
          >
            Recording not yet available. The full transcript is below.
          </p>
        </div>
      )}

      <p className="mt-3 text-sm text-[var(--tb-mute)]">{duration}</p>
    </div>
  );
}
