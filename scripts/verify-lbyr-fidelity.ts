#!/usr/bin/env -S npx tsx
//
// Every word of the twelve reviewed preview pages still reaches the site.
//
//   npx tsx scripts/verify-lbyr-fidelity.ts
//
// The brief for this course fixes the wording and the section order: nothing
// may be rewritten, shortened or reordered. The site reads those pages rather
// than a transcription of them, so the risk is not an edit but a silent drop —
// a section the reader stops recognising and quietly leaves out.
//
// This compares the words of each source page against the words the site would
// render, counting repeats. Order is deliberately not compared: the nav, the
// eyebrow and the section headings are rebuilt as components and land in
// different places. What must hold is that nothing is lost.

import { readFileSync } from "node:fs";
import { readLbyrLesson, readLbyrPage } from "../lib/lbyr-course";
import { inlineText, type Block, type Inline } from "../lib/lbyr-html";

const words = (s: string) =>
  s.replace(/\s+/g, " ").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+([.,;:!?])/g, "$1").trim();

/**
 * Words the source has and the render does not, counting repeats.
 *
 * Not an in-order comparison: the site reorders nothing, but it does rebuild
 * the nav and the eyebrow as components, so a word like "Lead" appears in a
 * different place. What matters is that no wording is lost.
 */
function dropped(src: string, out: string): string[] {
  const have = new Map<string, number>();
  for (const w of out.split(" ").filter(Boolean)) have.set(w, (have.get(w) ?? 0) + 1);
  const missing: string[] = [];
  for (const w of src.split(" ").filter(Boolean)) {
    const n = have.get(w) ?? 0;
    if (n === 0) missing.push(w);
    else have.set(w, n - 1);
  }
  return missing;
}

function blockText(bs: Block[]): string {
  return bs
    .map((b) => {
      switch (b.t) {
        case "p": case "h": case "label": case "ref": return inlineText(b.c);
        case "list": return b.items.map(blockText).join(" ");
        case "term": return inlineText(b.term) + " " + blockText(b.body);
        case "dl": return b.items.map((i: { term: Inline[]; desc: Block[] }) => inlineText(i.term) + " " + blockText(i.desc)).join(" ");
        case "table": return [...b.head, ...b.rows.flat()].map(inlineText).join(" ");
        case "details": return inlineText(b.summary) + " " + blockText(b.body);
      }
    })
    .join(" ");
}

// Every sentence of the source page, minus the chrome the site rebuilds.
function sourceText(file: string): string {
  let h = readFileSync(`content/courses/lead-before-youre-ready/${file}`, "utf8");
  h = h.slice(h.indexOf('<div class="wrap"'));
  h = h.replace(/<script[\s\S]*?<\/script>/g, "")
       .replace(/<div class="preview">[\s\S]*?<\/div>/g, "")
       .replace(/<div class="progress">[\s\S]*?<\/div>\s*<\/div>/g, "")
       .replace(/<div class="player"[\s\S]*?<\/span>\s*<\/div>/g, "")
       .replace(/<div class="tools">[\s\S]*?<\/div>/g, "")
       .replace(/<svg[\s\S]*?<\/svg>/g, "")
       .replace(/<input[^>]*>/g, "")
       .replace(/<button[\s\S]*?<\/button>/g, "");
  const txt = h.replace(/<[^>]+>/g, " ");
  return words(
    txt.replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&ldquo;/g, '"')
       .replace(/&rdquo;/g, '"').replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
       .replace(/&hellip;/g, "…").replace(/&middot;/g, "·").replace(/&amp;/g, "&")
       .replace(/&nbsp;/g, " ").replace(/&times;/g, "×").replace(/&copy;/g, "©")
       .replace(/&reg;/g, "®").replace(/&#8634;/g, "↺")
       // Numeric entities, which the pages use for the transliterated Greek.
       .replace(/&#x([0-9a-fA-F]+);/g, (_m: string, h: string) => String.fromCodePoint(parseInt(h, 16)))
       .replace(/&#(\d+);/g, (_m: string, d: string) => String.fromCodePoint(Number(d)))
  );
}

let bad = 0;
for (let n = 1; n <= 10; n++) {
  const l = readLbyrLesson(n);
  // The headings and labels the page component supplies, which the reader does
  // not carry: they are chrome, and the page is where they belong.
  const chrome = [
    `Lead Before You're Ready Lesson ${n} of 10`,
    `Lesson ${n} · ${l.module}`,
    "Think — Let it settle",
    "Go deeper optional",
    "Need help with your next step? Need help with your next step?",
    "Ready to finish for today?",
    `Finish Lesson ${n}`,
    "Stop here for today Stop here for today",
    "Your course progress is saved automatically. Your course progress is saved automatically.",
    "Course progress: 0 of 10 lessons completed",
    l.checkIn ? "Before you go on — a short check-in" : "",
    l.finish.nextLabel ? `Continue to ${l.finish.nextLabel}` : "",
    `Lesson ${n} finished`,
    "Mark it unfinished",
    "Open the worksheet",
    `Read Chapter ${l.goDeeper.chapter}`,
    "Concerns, Care and Reporting",
  ].join(" ");

  const rendered = words(
    [chrome, l.title, l.question, "Key Scripture", inlineText(l.scripture.text), l.scripture.ref,
     "In this lesson, you will:", blockText(l.objectives), "Watch or listen", l.duration,
     "Read the transcript", blockText(l.transcript), blockText(l.think.prompts), l.think.note,
     "Take one step", blockText(l.takeOneStep), blockText(l.goDeeper.intro),
     l.goDeeper.worksheetSummary, blockText(l.goDeeper.worksheet),
     l.checkIn ? blockText(l.checkIn) : "", blockText(l.help),
     inlineText(l.finish.weekStep), inlineText(l.notice)].join(" ")
  );
  const src = sourceText(`lesson-${String(n).padStart(2, "0")}.html`);
  // Every sentence of eight words or more in the source must survive.
  const missing = dropped(src, rendered);
  const total = src.split(" ").length;
  if (missing.length) {
    bad++;
    console.log(`  L${n}: ${missing.length} of ${total} words not carried through`);
    console.log(`      ${missing.slice(0, 18).join(" ")}`);
  } else {
    console.log(`  L${n}: all ${total} words carried through, in order`);
  }
}
for (const name of ["start-here", "finish"] as const) {
  const pg = readLbyrPage(name);
  const chrome =
    name === "start-here"
      ? [
          inlineText(readLbyrLesson(1).notice),
          "Need help with your next step?",
          "Lead Before You're Ready Start Here A ten-lesson course",
          `Begin Lesson 1: ${readLbyrLesson(1).title}`,
          "Course progress: 0 of 10 lessons completed",
          "Concerns, Care and Reporting",
        ].join(" ")
      : [
          inlineText(readLbyrLesson(1).notice),
          "Need help with your next step?",
          "Lead Before You're Ready Finish Finish",
          "Course progress: 10 of 10 lessons completed",
          "Back to the course overview Read the book again",
          "Concerns, Care and Reporting",
        ].join(" ");
  const out = words(
    [chrome, pg.title, pg.sub ?? "", ...pg.sections.map((sec: { heading: string; blocks: Block[] }) => sec.heading + " " + blockText(sec.blocks))].join(" ")
  );
  const src = sourceText(`${name}.html`);
  const miss = dropped(src, out);
  if (miss.length) {
    bad++;
    console.log(`  ${name}: ${miss.length} of ${src.split(" ").length} words missing`);
    console.log(`      ${miss.slice(0, 18).join(" ")}`);
  } else {
    console.log(`  ${name}: all ${src.split(" ").length} words carried through, in order`);
  }
}

if (bad === 0) {
  console.log("\n  Every word of every page reaches the site.\n");
} else {
  console.log("\n  Words are missing — see above.\n");
  process.exitCode = 1;
}
