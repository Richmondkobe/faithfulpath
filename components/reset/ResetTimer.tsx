"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The silence timer a session offers before its still time.
 *
 * It counts down and it ends with a soft chime made in the browser — no file,
 * so nothing to load and nothing to fail. The lengths are the ones the page
 * offers, and a shorter one is always a fair choice: the page says so in its
 * own words and the control does not argue with it.
 *
 * Nothing about it is saved. How long somebody sat in silence, and whether
 * they finished, is not a thing this course records.
 */
export default function ResetTimer({ minutes }: { minutes: number[] }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const chimed = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || left > 0 || chimed.current) return;
    chimed.current = true;
    setRunning(false);
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 528;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.6);
    } catch {
      // A silent end is still an end.
    }
  }, [left, running]);

  function start(m: number) {
    chimed.current = false;
    setChosen(m);
    setLeft(m * 60);
    setRunning(true);
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="mt-4 rounded-sm border border-[#D9CDBA] bg-[#F7F1E6] px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[#6B5F53]">Silence timer</span>
        {minutes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => start(m)}
            className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
              chosen === m
                ? "border-[#8B5E34] bg-[#F3EADC] text-[#2B2118]"
                : "border-[#D9CDBA] bg-white text-[#5C5147] hover:border-[#8B5E34]"
            }`}
          >
            {m} min
          </button>
        ))}
      </div>

      {chosen !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-2xl tabular-nums text-[#2B2118]">
            {mm}:{ss}
          </span>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-sm border border-[#D9CDBA] bg-white px-3 py-2 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
          >
            {running ? "Pause" : left === 0 ? "Done" : "Resume"}
          </button>
          <button
            type="button"
            onClick={() => {
              setChosen(null);
              setRunning(false);
              setLeft(0);
            }}
            className="text-sm text-[#8B5E34] underline underline-offset-4 hover:text-[#2B2118]"
          >
            Clear
          </button>
        </div>
      )}
      <p className="mt-3 text-sm text-[#6B5F53]">
        Nothing here is saved. A shorter time is a fair choice.
      </p>
    </div>
  );
}
