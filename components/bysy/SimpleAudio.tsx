"use client";

import { useRef, useState } from "react";

/**
 * The Listen control and the transcript, to addendum §4.
 *
 * The audio is the lesson; everything else on the page is there to hold it. So
 * the control is large, says how long the recording is before it is started,
 * and offers the two things a listener actually reaches for — back fifteen
 * seconds, and a slower or faster voice.
 *
 * The transcript is closed. §4 is explicit about that, and the reason is not
 * tidiness: this course is read by people who may be watched, and a page that
 * unfolds seven minutes of prose about recognising coercion is a page that
 * cannot be glanced past. It opens when the learner asks, and the summary says
 * what is inside so nobody has to open it to find out.
 *
 * Before the recording exists the control says so plainly and the transcript
 * stays available, so the lesson can still be read.
 */
export default function SimpleAudio({
  src,
  length,
  transcript,
}: {
  src: string | null;
  /** "about 7 minutes", as the page states it. */
  length: string | null;
  transcript: React.ReactNode;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [rate, setRate] = useState(1);

  function setSpeed(next: number) {
    setRate(next);
    if (audio.current) audio.current.playbackRate = next;
  }

  return (
    <section className="mt-6">
      {src ? (
        <div className="rounded-xl border border-field bg-sand px-4 py-4">
          <audio ref={audio} controls preload="none" className="w-full">
            <source src={src} type="audio/mpeg" />
            Your browser cannot play this recording.
          </audio>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (audio.current) audio.current.currentTime = Math.max(0, audio.current.currentTime - 15);
              }}
              className="rounded-xl border-[1.5px] border-navy bg-white px-3 py-2 text-sm text-navy transition-colors hover:border-gold-text"
            >
              ↺ Back 15 seconds
            </button>
            <span className="text-sm text-muted">Speed</span>
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={rate === r}
                onClick={() => setSpeed(r)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  rate === r
                    ? "border-gold-text bg-sand text-navy"
                    : "border-field bg-white text-muted hover:border-gold-text"
                }`}
              >
                {r}×
              </button>
            ))}
            {/* No separator. The row is a flex with its own gap, so the
                middot that used to join this to the speed buttons sat as a
                stray mark rather than between two things. */}
            {length && <span className="text-sm text-muted">{length}</span>}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-line bg-sand px-4 py-3 text-sm leading-relaxed text-ink">
          The recording for this lesson is not up yet{length ? ` — it will be ${length}` : ""}.
          You can read it instead, below.
        </p>
      )}

      <details className="group mt-4 rounded-xl border border-line">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm text-navy transition-colors hover:bg-sand">
          <span className="font-medium">Read the full transcript</span>
          <span className="ml-2 text-muted">
            — every word of the recording, in writing
          </span>
        </summary>
        <div className="border-t border-line px-4 pb-4">{transcript}</div>
      </details>
    </section>
  );
}
