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

export type LessonQuestion = {
  id: string;
  kind: "recall" | "true_false" | "reflection";
  prompt: string;
  /** What the lesson said. Absent on a reflection, which has no answer. */
  answer?: string;
  /** A sentence of why, shown with the answer. */
  note?: string;
};

export type LessonQuestions = { intro: string; questions: LessonQuestion[] };

/**
 * The questions that follow a lesson's slides.
 *
 * Nothing here is scored, required or counted, which is the course's rule
 * everywhere else and the reason these sit after the teaching rather than
 * guarding anything. A recall question shows what the lesson said when the
 * member asks to see it; a reflection has no answer to show.
 */
export const readQuestions = cache((order: number): LessonQuestions | null => {
  const path = join(process.cwd(), ROOT, lessonFolder(order), "questions.json");
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as LessonQuestions;
    return parsed.questions?.length ? parsed : null;
  } catch {
    return null;
  }
});

/**
 * What this particular lesson sets out to teach, in three or four lines.
 *
 * Written per lesson and drawn from its own slides — Lesson 1's come from the
 * slides on useful thinking against circling, the one question to ask of a
 * thought, what sits underneath the circling, and the practice at the end. They
 * are not generated and not generic: a list that would fit any lesson in the
 * course tells a member nothing about this one.
 *
 * A lesson without the file falls back to the single line on its own slide 2,
 * which is what every lesson showed before.
 */
export const readObjectives = cache((order: number): string[] | null => {
  const path = join(process.cwd(), ROOT, lessonFolder(order), "objectives.json");
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      objectives?: string[];
    };
    const list = parsed.objectives?.filter((o) => o.trim()) ?? [];
    return list.length ? list : null;
  } catch {
    return null;
  }
});

/**
 * The line each deck already carries on its second slide.
 *
 * Every lesson's slide 2 is headed "Today you will learn", so the page says
 * what the deck says rather than repeating it in a second place that could
 * drift from the recording.
 */
export function willLearnFrom(slides: Slide[]): string | null {
  const slide = slides[1];
  if (!slide || !/today you will learn/i.test(slide.label)) return null;
  return slide.h.replace(/<[^>]+>/g, "").trim() || null;
}
