import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import type { Slide } from "@/components/mind/SlidePlayer";

// The slide lecture for a lesson: its slides, its recording and its transcript.
//
// slides.json is extracted from that lesson's pilot page by
// scripts/extract-slides.mjs. The pilot itself is not in git — it embeds its
// own mp3 as base64 — so the JSON is what ships, and the pilot stays on disk as
// the thing it was extracted from.
//
// A lesson without slides.json renders the course as it was. That is what lets
// the lessons be converted one at a time rather than all at once.

const ROOT = join("content", "courses", "when-your-mind-wont-rest");

/** "lesson-07" from 7. The decks are numbered by the lesson's order. */
export function lessonFolder(order: number): string {
  return `lesson-${String(order).padStart(2, "0")}`;
}

/** The recording's id in the bucket, without its extension. */
export function slideAudioId(order: number): string {
  return `wymwr-lesson-${String(order).padStart(2, "0")}`;
}

export const readSlides = cache((order: number): Slide[] | null => {
  const path = join(process.cwd(), ROOT, lessonFolder(order), "slides.json");
  if (!existsSync(path)) return null;
  try {
    const slides = JSON.parse(readFileSync(path, "utf8")) as Slide[];
    return Array.isArray(slides) && slides.length > 0 ? slides : null;
  } catch {
    // A lesson whose slides will not parse falls back to the written page
    // rather than rendering a player with nothing in it.
    return null;
  }
});

/**
 * The practice, taken from the slide that asks for it.
 *
 * "Take one step" on the page and the "Do this now" slide are the same
 * instruction, so the page says it in the slide's own words rather than in a
 * second set that could drift from them. The slide's illustration and its
 * "Pause the audio" badge are left behind: the badge is about the recording,
 * and by the time somebody reads this the recording has already stopped.
 */
export function practiceFrom(slides: Slide[], pauseAfterSlide = 10) {
  const slide = slides[pauseAfterSlide - 1];
  if (!slide) return null;

  const lines = [...slide.body.matchAll(/<p[^>]*class=["']?body["']?[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);

  return { heading: slide.h.replace(/<[^>]+>/g, "").trim(), lines };
}

/**
 * The narration, one paragraph per slide, in slide order.
 *
 * This is the transcript, and it is what a member reads if they would rather
 * not listen, or cannot. Both layouts the decks were built in are tried, since
 * the two batches named this file differently.
 */
export const readNarration = cache((order: number): string[] => {
  const folder = lessonFolder(order);
  const n = String(order).padStart(2, "0");
  for (const name of [`lesson-${n}-narration.txt`, `wymwr-lesson-${n}-narration.txt`]) {
    const path = join(process.cwd(), ROOT, folder, name);
    if (!existsSync(path)) continue;
    return readFileSync(path, "utf8")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
});
