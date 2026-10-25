"use client";

import { useState, useSyncExternalStore } from "react";
import type { DayVerse } from "@/lib/verses";

/**
 * The verse for the visitor's own date, changing at their own midnight (even
 * with the page left open). The server sends yesterday, today and tomorrow in
 * UTC; before the browser takes over, today in UTC is shown.
 */

const localDate = () => new Intl.DateTimeFormat("en-CA").format(new Date());

/** Re-renders at the next local midnight. */
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const arm = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    timer = setTimeout(() => {
      onChange();
      arm();
    }, next.getTime() - now.getTime());
  };
  arm();
  return () => clearTimeout(timer);
}

export default function VerseOfTheDay({ verses, notice }: { verses: DayVerse[]; notice: string }) {
  const serverToday = verses[Math.min(1, verses.length - 1)]?.date ?? "";
  const today = useSyncExternalStore(subscribe, localDate, () => serverToday);
  const [copied, setCopied] = useState(false);
  // The visitor's date, or the latest one before it.
  const verse = verses.find((v) => v.date === today) ?? [...verses].reverse().find((v) => v.date < today) ?? verses[0];
  if (!verse) return null;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`“${verse.text}” ${verse.ref} (ESV)`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="verse-label" className="rounded-2xl border border-gold-line/60 bg-paper p-6 sm:p-7">
      <p id="verse-label" className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">
        Verse of the day
      </p>
      <blockquote className="mt-3">
        <p className="text-[1.45rem] leading-snug text-navy sm:text-[1.7rem]" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
          &ldquo;{verse.text}&rdquo;
        </p>
        <footer className="mt-3 text-[15px] font-semibold text-gold-text">
          <cite className="not-italic">{verse.ref}</cite> <span className="font-normal text-muted">(ESV)</span>
        </footer>
      </blockquote>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-11 items-center rounded-xl border border-gold-line/60 bg-white px-4 text-sm font-semibold text-gold-text transition-colors hover:border-gold-line"
        >
          Share
        </button>
        <span role="status" className="text-sm text-muted">
          {copied ? "Copied. Paste it wherever you like." : ""}
        </span>
      </div>
      <p className="mt-5 text-[11px] leading-relaxed text-muted">{notice}</p>
    </section>
  );
}
