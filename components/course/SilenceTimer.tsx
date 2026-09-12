"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The silence timer.
 *
 * While it runs the screen goes dim and stays still: no progress animation, no
 * ticking, nothing to watch. A member sitting in silence should not be given
 * something to look at. The remaining time is there if they want it, in one
 * quiet line.
 *
 * Where Richmond's opening and closing clips exist they are played either side
 * of the silence. Where they do not, the timer runs plainly and ends with a
 * soft two-note chime synthesised in the browser, so a session is never
 * dependent on a recording that has not been made yet.
 */
export default function SilenceTimer({
  lengths,
  suggested,
  openingSrcFor,
  closingSrc,
}: {
  lengths: number[];
  suggested: number | null;
  /** Opening clip per length, where one exists. */
  openingSrcFor: Record<number, string | null>;
  closingSrc: string | null;
}) {
  const options = [...new Set([...lengths, ...(suggested ? [suggested] : [])])].sort(
    (a, b) => a - b
  );

  const [minutes, setMinutes] = useState(suggested ?? options[1] ?? options[0]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "opening" | "silence" | "closing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The end time rather than a tick count: a browser throttles timers in a
  // background tab, and thirty minutes of that would drift badly.
  const endsAtRef = useRef<number>(0);

  const chime = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [0, 0.45].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = i === 0 ? 528 : 396;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + offset + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 1.8);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 1.9);
      });
      window.setTimeout(() => void ctx.close(), 3000);
    } catch {
      // No audio available; the visible countdown is the whole timer.
    }
  }, []);

  const finish = useCallback(() => {
    setPhase("closing");
    setRemaining(null);
    if (closingSrc) {
      const el = new Audio(closingSrc);
      audioRef.current = el;
      el.onended = () => setPhase("idle");
      void el.play().catch(() => {
        chime();
        setPhase("idle");
      });
    } else {
      chime();
      window.setTimeout(() => setPhase("idle"), 2500);
    }
  }, [chime, closingSrc]);

  // One interval for the whole silence, reading the clock each time so the
  // count stays true whatever the browser does with a background tab.
  useEffect(() => {
    if (phase !== "silence") return;

    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(id);
        finish();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [phase, finish]);

  function begin() {
    const seconds = minutes * 60;
    const opening = openingSrcFor[minutes] ?? null;

    const startSilence = () => {
      endsAtRef.current = Date.now() + seconds * 1000;
      setRemaining(seconds);
      setPhase("silence");
    };

    if (opening) {
      setPhase("opening");
      const el = new Audio(opening);
      audioRef.current = el;
      el.onended = startSilence;
      void el.play().catch(startSilence);
      return;
    }
    startSilence();
  }

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    setRemaining(null);
    setPhase("idle");
  }

  if (phase !== "idle") {
    const mm = Math.floor((remaining ?? 0) / 60);
    const ss = String((remaining ?? 0) % 60).padStart(2, "0");
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1A1512] px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B7355]">
          {phase === "opening"
            ? "Beginning"
            : phase === "closing"
              ? "The silence is ending"
              : "Silence"}
        </p>
        {phase === "silence" && (
          <p className="mt-6 text-5xl tabular-nums text-[#C9B89E]" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            {mm}:{ss}
          </p>
        )}
        <button
          type="button"
          onClick={stop}
          className="mt-12 text-sm text-[#8B7355] underline underline-offset-4 transition-colors hover:text-[#C9B89E]"
        >
          Stop
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Silence timer
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setMinutes(n)}
            className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
              minutes === n
                ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                : "border-[#D9CDBA] text-[#5C5147] hover:border-[#8B5E34]"
            }`}
          >
            {n} min
            {suggested === n && (
              <span className="ml-1 text-[11px] text-[#8B5E34]">suggested</span>
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={begin}
        className="mt-4 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
      >
        Begin {minutes} minutes of silence
      </button>
      <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">
        The screen dims and stays still while the time runs. You can stop at any
        moment.
      </p>
    </div>
  );
}
