#!/usr/bin/env node
//
// Pull each Lead Before You're Ready lesson's slides out of its pilot page.
//
//   node scripts/extract-lbyr-slides.mjs            # all ten
//   node scripts/extract-lbyr-slides.mjs lesson-01  # just one
//
// The pilot page is the source of truth: it is the player the slides were
// timed against, so its `const DATA` is what the site should render rather
// than anything reassembled from timings.json. The two agree today and there
// is no reason to trust that they always will — this checks that they do and
// says so when they do not.
//
// The pilots are not in git (each embeds its mp3 as base64), so this reads
// them from disk and writes slides.json beside them, which is what the lesson
// page loads. It also writes the ART map out as JSX, because this course
// renders its illustrations as components rather than as injected markup.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "lead-before-youre-ready");
const ALL = Array.from({ length: 10 }, (_, i) => `lesson-${String(i + 1).padStart(2, "0")}`);
const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const LESSONS = wanted.length ? wanted : ALL;

/**
 * A braced or bracketed literal following `const NAME = `.
 *
 * Matched by counting brackets rather than by a regex over the whole file: the
 * slide bodies and the SVG paths contain brackets and quotes of their own, and
 * a lazy match stops at the first one inside a path.
 */
function literalAfter(source, name) {
  const at = source.indexOf(`const ${name} = `);
  if (at < 0) throw new Error(`no "const ${name} =" in the pilot`);
  let i = at + `const ${name} = `.length;
  const open = source[i];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = null;
  for (let j = i; j < source.length; j++) {
    const c = source[j];
    if (inString) {
      if (c === "\\") j++;
      else if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inString = c; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return source.slice(i, j + 1);
    }
  }
  throw new Error(`"const ${name} =" is never closed`);
}

let wrote = 0;
const artByLesson = new Map();

for (const lesson of LESSONS) {
  const pilot = join(ROOT, lesson, "pilot.html");
  if (!existsSync(pilot)) {
    console.log(`  ${lesson}: no pilot.html, skipped`);
    continue;
  }
  const source = readFileSync(pilot, "utf8");
  const data = JSON.parse(literalAfter(source, "DATA"));

  if (!Array.isArray(data.slides) || !Array.isArray(data.timings)) {
    throw new Error(`${lesson}: DATA has no slides/timings array`);
  }
  if (data.slides.length !== data.timings.length) {
    throw new Error(
      `${lesson}: ${data.slides.length} slides but ${data.timings.length} timings`
    );
  }
  const sorted = data.timings.every((t, i) => i === 0 || t >= data.timings[i - 1]);
  if (!sorted) throw new Error(`${lesson}: timings are not in order`);

  // timings.json sits beside the pilot and should say the same thing.
  const sidecar = join(ROOT, lesson, "timings.json");
  if (existsSync(sidecar)) {
    const beside = JSON.parse(readFileSync(sidecar, "utf8"));
    const same =
      beside.length === data.timings.length &&
      beside.every((t, i) => Math.abs(t - data.timings[i]) < 0.01);
    if (!same) console.log(`  ${lesson}: WARNING timings.json disagrees with the pilot`);
  }

  const pauses = data.slides.filter((s) => s.autoPause).length;
  writeFileSync(
    join(ROOT, lesson, "slides.json"),
    JSON.stringify({ lesson: data.lesson, title: data.title, slides: data.slides, timings: data.timings }, null, 2) + "\n"
  );
  artByLesson.set(lesson, literalAfter(source, "ART"));
  wrote++;
  console.log(
    `  ${lesson}: ${data.slides.length} slides, ${pauses} pause, ends ${data.timings.at(-1)}s`
  );
}

/* ---------------- the illustrations, as one shared map ---------------- */

if (artByLesson.size) {
  // Every pilot carries its own ART map. They overlap heavily but they do not
  // all agree: lesson 2 draws dawn, tables, clock and two differently from the
  // rest, and all four are used on both sides, so one merged map would show
  // the wrong picture somewhere. The common definition becomes the base and a
  // lesson that disagrees gets an override, rather than the first one winning
  // silently.
  const defs = new Map();                 // key -> Map(svg -> [lesson, …])
  for (const [lesson, block] of artByLesson) {
    for (const [, key, svg] of block.matchAll(/([a-zA-Z0-9_]+)\s*:\s*`([\s\S]*?)`/g)) {
      const trimmed = svg.trim();
      if (!defs.has(key)) defs.set(key, new Map());
      const bySvg = defs.get(key);
      bySvg.set(trimmed, [...(bySvg.get(trimmed) ?? []), lesson]);
    }
  }

  const toJsx = (svg) =>
    svg
      .replace(/\sclass=/g, " className=")
      .replace(/stroke-width=/g, "strokeWidth=")
      .replace(/stroke-linecap=/g, "strokeLinecap=")
      .replace(/stroke-linejoin=/g, "strokeLinejoin=")
      .replace(/stroke-dasharray=/g, "strokeDasharray=")
      .replace(/style="--d:([^"]*)"/g, (_m, d) => `style={{ "--d": "${d.trim()}" } as CSSProperties}`);

  const base = new Map();
  const overrides = new Map();            // lesson -> Map(key -> svg)
  for (const [key, bySvg] of defs) {
    const variants = [...bySvg.entries()].sort((a, b) => b[1].length - a[1].length);
    base.set(key, variants[0][0]);
    for (const [svg, lessons] of variants.slice(1)) {
      for (const lesson of lessons) {
        if (!overrides.has(lesson)) overrides.set(lesson, new Map());
        overrides.get(lesson).set(key, svg);
      }
    }
  }

  const baseJsx = [...base.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, svg]) => `  ${k}: (\n    ${toJsx(svg)}\n  ),`)
    .join("\n");

  const overrideJsx = [...overrides.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lesson, map]) => {
      const inner = [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, svg]) => `    ${k}: (\n      ${toJsx(svg)}\n    ),`)
        .join("\n");
      return `  "${lesson}": {\n${inner}\n  },`;
    })
    .join("\n");

  writeFileSync(
    join("components", "lbyr", "LbyrSlideArt.tsx"),
    `import type { CSSProperties, ReactElement } from "react";

/**
 * The line illustrations for Lead Before You're Ready.
 *
 * Generated by scripts/extract-lbyr-slides.mjs from the ART maps in the pilot
 * pages — do not edit by hand; re-run the extractor. They are JSX rather than
 * SVG strings so nothing in this course sets raw markup, which is how Talk
 * Before You Marry carries its own.
 *
 * Most illustrations are the same in every pilot and live in BASE. A few are
 * not: lesson 2 draws some of them differently, and because those names are
 * used by other lessons too, one merged map would have shown the wrong picture
 * on one side or the other. Those live in BY_LESSON and win for that lesson.
 *
 * artFor() is what a page should call. An unknown name renders nothing, which
 * is what a missing illustration should do.
 */
const BASE: Record<string, ReactElement> = {
${baseJsx}
};

const BY_LESSON: Record<string, Record<string, ReactElement>> = {
${overrideJsx}
};

export function artFor(lesson: number, key: string | undefined): ReactElement | null {
  if (!key) return null;
  const slug = "lesson-" + String(lesson).padStart(2, "0");
  return BY_LESSON[slug]?.[key] ?? BASE[key] ?? null;
}
`
  );
  console.log(
    `\n  ${base.size} illustrations, ${[...overrides.values()].reduce((n, m) => n + m.size, 0)} per-lesson override(s), written to components/lbyr/LbyrSlideArt.tsx`
  );
  for (const [lesson, map] of overrides) {
    console.log(`     ${lesson} draws its own: ${[...map.keys()].join(", ")}`);
  }
}

console.log(`\n  ${wrote} lesson(s) extracted.\n`);
