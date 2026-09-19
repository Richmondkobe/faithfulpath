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
        <div className="rounded-sm border border-[#D9CDBA] bg-[#F7F1E6] px-4 py-4">
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
              className="rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
            >
              ↺ Back 15 seconds
            </button>
            <span className="text-sm text-[#6B5F53]">Speed</span>
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={rate === r}
                onClick={() => setSpeed(r)}
                className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                  rate === r
                    ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                    : "border-[#D9CDBA] bg-white text-[#5C5147] hover:border-[#8B5E34]"
                }`}
              >
                {r}×
              </button>
            ))}
            {length && <span className="text-sm text-[#6B5F53]">· {length}</span>}
          </div>
        </div>
      ) : (
        <p className="rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
          The recording for this lesson is not up yet{length ? ` — it will be ${length}` : ""}.
          You can read it instead, below.
        </p>
      )}

      <details className="group mt-4 rounded-sm border border-[#E5D9C7]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm text-[#2B2118] transition-colors hover:bg-[#F7F1E6]">
          <span className="font-medium">Read the transcript</span>
          <span className="ml-2 text-[#6B5F53]">
            — the words of the recording, in full
          </span>
        </summary>
        <div className="border-t border-[#E5D9C7] px-4 pb-4">{transcript}</div>
      </details>
    </section>
  );
}
