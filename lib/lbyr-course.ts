import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  LBYR_PUBLISHED,
  LBYR_SLUG,
  lbyrLessonSlug,
  moduleFor,
} from "@/lib/lbyr-links";

import {
  decode,
  inlineText,
  parseBlocks,
  parseInline,
  section,
  type Block,
  type Inline,
} from "@/lib/lbyr-html";

/**
 * "Lead Before You're Ready" — the course, read from its own preview pages.
 *
 * content/courses/lead-before-youre-ready/ holds twelve reviewed HTML pages
 * whose text and section order are final. Rather than transcribe them into
 * Markdown and keep two copies in step, the site reads them directly and
 * renders the result through components. Nothing here rewrites, reorders or
 * shortens anything; if a page stops matching the shape below, the reader
 * throws rather than quietly dropping a section.
 */

export {
  LBYR_SLUG,
  LBYR_BASE,
  LBYR_LESSON_COUNT,
  LBYR_MODULES,
  LBYR_PUBLISHED,
  moduleFor,
  lbyrLessonSlug,
  lbyrLessonHref,
  lbyrStartHereHref,
  lbyrFinishHref,
  lbyrConcernsHref,
} from "@/lib/lbyr-links";

/**
 * The gate every page of this course sits behind, alongside the membership
 * check. Off until the author says publish, and it closes the routes rather
 * than only hiding the card — an unpublished course any member could still
 * reach by URL would only be an unlinked one.
 *
 * Preview and development builds are the exception, so the course can be
 * reviewed before it is published. A member on the live site cannot reach it
 * either way; only someone holding a Vercel preview URL can, which is the
 * point of the preview. When LBYR_PUBLISHED becomes true this whole check
 * stops mattering and can go.
 */
export function requireLbyrPublished() {
  if (LBYR_PUBLISHED) return;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return;
  if (process.env.NODE_ENV !== "production") return;
  notFound();
}

const ROOT = join(process.cwd(), "content", "courses", LBYR_SLUG);

/* ------------------------------------------------------------------ */

const read = (file: string): string => {
  const path = join(ROOT, file);
  if (!existsSync(path)) throw new Error(`lbyr: missing source page ${file}`);
  const raw = readFileSync(path, "utf8");
  const at = raw.indexOf('<div class="wrap"');
  if (at < 0) throw new Error(`lbyr: ${file} has no <div class="wrap">`);
  return raw.slice(at).replace(/<script[\s\S]*?<\/script>/g, "");
};

/** Removes a <div class="..."> and everything in it, nesting included. */
function dropElement(html: string, cls: string): string {
  const open = new RegExp(`<div\\b[^>]*class="${cls}"[^>]*>`, "i");
  let out = html;
  for (;;) {
    const m = out.match(open);
    if (!m || m.index === undefined) return out;
    let i = m.index + m[0].length;
    let depth = 1;
    while (depth > 0) {
      const nextOpen = out.slice(i).search(/<div\b[^>]*>/i);
      const nextClose = out.slice(i).search(/<\/div>/i);
      if (nextClose < 0) throw new Error(`lbyr: <div class="${cls}"> is never closed`);
      if (nextOpen >= 0 && nextOpen < nextClose) {
        i += nextOpen + out.slice(i + nextOpen).match(/<div\b[^>]*>/i)![0].length;
        depth++;
      } else {
        i += nextClose + "</div>".length;
        depth--;
      }
    }
    out = out.slice(0, m.index) + out.slice(i);
  }
}

/**
 * Chrome that becomes a component rather than content: the progress bar, the
 * placeholder player, the Go deeper buttons, and the preview banner. Stripped
 * before parsing so the parser only ever sees prose.
 */
const stripChrome = (html: string): string =>
  dropElement(dropElement(dropElement(html, "progress"), "player"), "tools")
    .replace(/<div class="preview">[\s\S]*?<\/div>/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<button[\s\S]*?<\/button>/g, "")
    .replace(/<input[^>]*>/g, "")
    .replace(/<\/?label\b[^>]*>/g, "")
    .replace(/<a class="btn[^"]*"[\s\S]*?<\/a>/g, "");

/** Every <section> in document order, with its class and parsed blocks. */
function sections(html: string): { cls: string; blocks: Block[]; raw: string }[] {
  const out: { cls: string; blocks: Block[]; raw: string }[] = [];
  const re = /<section\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  const seen = new Map<string, number>();
  while ((m = re.exec(html))) {
    const cls = m[1].match(/class="([^"]*)"/)?.[1] ?? "";
    const nth = seen.get(cls) ?? 0;
    seen.set(cls, nth + 1);
    const inner = section(html, cls, nth);
    if (inner === null) continue;
    out.push({ cls, raw: inner, blocks: parseBlocks(stripChrome(inner)) });
  }
  return out;
}

const headingOf = (blocks: Block[]): string => {
  const h = blocks.find((b) => b.t === "h");
  return h && h.t === "h" ? inlineText(h.c) : "";
};

/** The blocks after the section's own heading. */
const bodyOf = (blocks: Block[]): Block[] => {
  const at = blocks.findIndex((b) => b.t === "h");
  return at < 0 ? blocks : blocks.slice(at + 1);
};

export type LbyrLesson = {
  order: number;
  slug: string;
  module: string;
  title: string;
  question: string;
  scripture: { text: Inline[]; ref: string };
  objectives: Block[];
  duration: string;
  transcript: Block[];
  think: { prompts: Block[]; note: string };
  takeOneStep: Block[];
  goDeeper: { intro: Block[]; worksheetSummary: string; worksheet: Block[]; chapter: number };
  checkIn: Block[] | null;
  help: Block[];
  finish: { weekStep: Inline[]; nextLabel: string | null };
  notice: Inline[];
};

export const readLbyrLesson = cache((order: number): LbyrLesson => {
  const file = `lesson-${String(order).padStart(2, "0")}.html`;
  const html = read(file);
  const all = sections(html);
  const at = (cls: string, nth = 0) => {
    const hits = all.filter((s) => s.cls === cls);
    const hit = hits[nth];
    if (!hit) throw new Error(`lbyr: ${file} has no section.${cls}[${nth}]`);
    return hit;
  };

  const head = at("card", 0).blocks;
  const title = head.find((b) => b.t === "h" && b.level === 1);
  const sub = head.find((b) => b.t === "p" && b.cls === "sub");
  if (!title || title.t !== "h" || !sub || sub.t !== "p") {
    throw new Error(`lbyr: ${file} heading card is not {h1, p.sub}`);
  }

  const scriptureSection = at("plain", 0).blocks;
  const scripture = scriptureSection.find((b) => b.t === "p" && b.cls === "scripture");
  const ref = scriptureSection.find((b) => b.t === "ref");
  if (!scripture || scripture.t !== "p" || !ref || ref.t !== "ref") {
    throw new Error(`lbyr: ${file} Key Scripture is not {p.scripture, span.ref}`);
  }

  const objectives = at("plain", 1);
  if (!/^In this lesson, you will/i.test(headingOf(objectives.blocks))) {
    throw new Error(`lbyr: ${file} second plain section is not the objectives`);
  }

  // The player card: a duration note and the transcript accordion.
  const player = at("card", 1);
  const note = player.blocks.find((b) => b.t === "p" && b.cls === "note");
  const transcript = player.blocks.find((b) => b.t === "details");
  if (!note || note.t !== "p" || !transcript || transcript.t !== "details") {
    throw new Error(`lbyr: ${file} player card is not {p.note, details}`);
  }

  const think = at("plain", 2);
  const prompts = think.blocks.find((b) => b.t === "list" && b.cls === "prompts");
  const thinkNote = think.blocks.find((b) => b.t === "p" && b.cls === "note");
  if (!prompts || prompts.t !== "list" || !thinkNote || thinkNote.t !== "p") {
    throw new Error(`lbyr: ${file} Think section is not {ul.prompts, p.note}`);
  }

  const step = at("card", 2);
  const deeper = at("plain", 3);
  const worksheet = deeper.blocks.find((b) => b.t === "details");
  if (!worksheet || worksheet.t !== "details") {
    throw new Error(`lbyr: ${file} Go deeper has no worksheet accordion`);
  }
  const chapterLabel = deeper.raw.match(/Read Chapter (\d+)/);
  if (!chapterLabel) throw new Error(`lbyr: ${file} Go deeper has no "Read Chapter N" button`);

  // Lesson 3 alone carries the check-in, between Go deeper and the help block.
  const checkInSection = all.find((s) => /Before you go on/i.test(headingOf(s.blocks)));

  const help = all.find((s) => s.cls === "plain help");
  if (!help) throw new Error(`lbyr: ${file} has no section.plain.help`);

  const finish = at("card", 3);
  const afterRaw = finish.raw.slice(finish.raw.indexOf('id="after"'));
  const weekStepHtml = afterRaw.match(/<p>([\s\S]*?)<\/p>/);
  if (!weekStepHtml) throw new Error(`lbyr: ${file} finish card has no week-step line`);
  const nextLabel = afterRaw.match(/Continue to ([^<]+)</)?.[1] ?? null;

  const noticeHtml = html.match(/<footer>[\s\S]*?<p>([\s\S]*?)<\/p>/);
  if (!noticeHtml) throw new Error(`lbyr: ${file} has no footer notice`);

  return {
    order,
    slug: lbyrLessonSlug(order),
    module: moduleFor(order),
    title: inlineText(title.c),
    question: inlineText(sub.c),
    scripture: { text: scripture.c, ref: inlineText(ref.c) },
    objectives: bodyOf(objectives.blocks),
    duration: inlineText(note.c),
    transcript: transcript.body,
    think: { prompts: prompts.items.flat(), note: inlineText(thinkNote.c) },
    takeOneStep: bodyOf(step.blocks),
    goDeeper: {
      intro: bodyOf(deeper.blocks).filter((b) => b.t !== "details"),
      worksheetSummary: inlineText(worksheet.summary),
      worksheet: worksheet.body,
      chapter: Number(chapterLabel[1]),
    },
    checkIn: checkInSection ? bodyOf(checkInSection.blocks) : null,
    help: bodyOf(help.blocks),
    finish: { weekStep: parseInline(weekStepHtml[1]), nextLabel: nextLabel ? decode(nextLabel).trim() : null },
    notice: parseInline(noticeHtml[1]),
  };
});

export type LbyrSlideDeck = {
  lesson: number;
  title: string;
  slides: unknown[];
  timings: number[];
};

/**
 * A lesson's slide deck, where its recording has been wired.
 *
 * slides.json is written by scripts/extract-lbyr-slides.mjs from the pilot
 * page, which is the player the slides were timed against. A lesson without
 * one shows the "Recording coming soon" panel instead.
 */
export const readLbyrSlides = cache((order: number): LbyrSlideDeck | null => {
  const path = join(ROOT, `lesson-${String(order).padStart(2, "0")}`, "slides.json");
  if (!existsSync(path)) return null;
  try {
    const deck = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(deck.slides) && Array.isArray(deck.timings) ? deck : null;
  } catch {
    return null;
  }
});

/**
 * The lessons whose recordings are wired in.
 *
 * Deliberately a list rather than "does slides.json exist": all ten decks were
 * extracted at once, but the recordings go up one at a time and a deck with no
 * audio behind it would give the player a dead file. A lesson joins this when
 * its mp3 is in the bucket.
 */
export const LBYR_WIRED = new Set<number>([1]);

export type LbyrProsePage = { title: string; sub: string | null; sections: { heading: string; blocks: Block[] }[] };

/** Start Here and Finish: a title, then a run of headed sections. */
export const readLbyrPage = cache((file: "start-here" | "finish"): LbyrProsePage => {
  const html = read(`${file}.html`);
  const all = sections(html);
  const head = all[0].blocks;
  const title = head.find((b) => b.t === "h" && b.level === 1);
  const sub = head.find((b) => b.t === "p" && b.cls === "sub");
  if (!title || title.t !== "h") throw new Error(`lbyr: ${file}.html has no <h1>`);

  return {
    title: inlineText(title.c),
    sub: sub && sub.t === "p" ? inlineText(sub.c) : null,
    sections: all.slice(1).map((s) => ({ heading: headingOf(s.blocks), blocks: bodyOf(s.blocks) })),
  };
});
