#!/usr/bin/env node
// Pull each lesson's slides out of its pilot page and write them as JSON.
//
// The pilot page is the source of truth: it is the player the slides were
// timed against, so its `const S=[...]` is what the site should render rather
// than anything reassembled from deck.json and timings.json. Those two agree
// with it today and there is no reason to trust that they always will.
//
// The pilots are not in git — each embeds its own mp3 as base64 and they come
// to 234 MB — so this reads them from disk and writes slides.json beside them,
// which is what the lesson page loads.
//
// Two layouts, because the lessons were built in two batches:
//   1-17   lesson-NN-pilot-page.html
//   18-21  pilot.html
//
// Run with: npm run slides:extract [-- lesson-01 …]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "when-your-mind-wont-rest");
const LESSONS = Array.from({ length: 21 }, (_, i) => `lesson-${String(i + 1).padStart(2, "0")}`);

/** The pilot page for a lesson, under either batch's name. */
function pilotFor(lesson) {
  for (const name of [`${lesson}-pilot-page.html`, "pilot.html"]) {
    const path = join(ROOT, lesson, name);
    if (existsSync(path)) return path;
  }
  return null;
}

/**
 * The `S` array, read as JSON.
 *
 * Found by matching brackets from "const S=[" rather than by a regex over the
 * whole file: the slide bodies are HTML containing brackets and quotes of
 * their own, and a lazy match stops at the first "]" inside an SVG path.
 * Strings are tracked so a bracket inside one is not counted as depth.
 */
function slidesFrom(html) {
  const at = html.indexOf("const S=[");
  if (at === -1) return null;

  const start = html.indexOf("[", at);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === "\\") {
      escaped = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return JSON.parse(html.slice(start, i + 1));
    }
  }
  return null;
}

const only = process.argv.slice(2).filter((a) => a.startsWith("lesson-"));
const wanted = only.length ? only : LESSONS;

let written = 0;
const problems = [];

for (const lesson of wanted) {
  const pilot = pilotFor(lesson);
  if (!pilot) {
    problems.push(`${lesson}: no pilot page`);
    continue;
  }

  let slides;
  try {
    slides = slidesFrom(readFileSync(pilot, "utf8"));
  } catch (err) {
    problems.push(`${lesson}: could not parse S (${err.message})`);
    continue;
  }
  if (!slides) {
    problems.push(`${lesson}: no "const S=[" in ${pilot}`);
    continue;
  }

  // Every slide needs the four things the player reads. A missing `t` would
  // leave a slide that never arrives; a missing body, a blank screen.
  const fields = ["label", "h", "body", "t"];
  slides.forEach((s, i) => {
    for (const f of fields) {
      if (s[f] === undefined) problems.push(`${lesson}: slide ${i + 1} has no ${f}`);
    }
    if (typeof s.t !== "number") problems.push(`${lesson}: slide ${i + 1} has a non-numeric t`);
  });

  // The times must climb, or a slide would be skipped as the audio passes it.
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].t <= slides[i - 1].t) {
      problems.push(`${lesson}: slide ${i + 1} starts at or before slide ${i}`);
    }
  }
  if (slides.length !== 12) problems.push(`${lesson}: ${slides.length} slides, expected 12`);

  // `dark` decides the slide's background, and its absence means light.
  const out = slides.map((s) => ({
    label: s.label,
    h: s.h,
    body: s.body,
    dark: Boolean(s.dark),
    t: s.t,
  }));

  writeFileSync(join(ROOT, lesson, "slides.json"), JSON.stringify(out, null, 2) + "\n");
  written++;
  const last = out[out.length - 1];
  console.log(
    `  ${lesson}  ${out.length} slides, ${out.filter((s) => s.dark).length} dark, last starts ${Math.floor(last.t / 60)}:${String(Math.round(last.t % 60)).padStart(2, "0")}`
  );
}

console.log(`\n${written} of ${wanted.length} written.`);
if (problems.length) {
  console.error("\nproblems:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
