#!/usr/bin/env node
//
// Downloads the site's five faces from Google into fonts/, so that `next build`
// never has to.
//
//   node scripts/fetch-fonts.mjs          # download
//   node scripts/fetch-fonts.mjs --check  # report what would change
//
// Why this exists: next/font/google fetches from Google at build time, and two
// of three production deployments on 3 October 2026 failed when that fetch did
// — a different font each time, on commits that touched only a build script.
// The files are committed instead, and next/font/local serves them.
//
// Why `text=` rather than the usual subset URLs: Google serves a family split
// across several files with a unicode-range each (latin, latin-ext,
// vietnamese). next/font/local's `src` takes only path, weight and style, so it
// cannot reproduce that split — one file per face is the shape it needs. Asking
// for an explicit character set returns exactly that: one file, no
// unicode-range, subset by Google from the authentic font.
//
// The inventory below is a superset of every character the site renders. It was
// not guessed: the articles, products and content/ were scanned for characters
// outside Google's latin subset, and the only letters found were "ē" and "ō"
// (34 uses, in the church-leadership-training article), both Latin Extended-A.
// So the whole of Basic Latin, Latin-1 Supplement and Latin Extended-A is
// included, which covers those with room to spare, plus the punctuation and
// symbols the site uses.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = "fonts";
const check = process.argv.includes("--check");

// A browser UA, or Google serves ttf instead of woff2.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i));

const CHARS = [
  ...range(0x20, 0x7e), // Basic Latin, printable
  ...range(0xa0, 0xff), // Latin-1 Supplement
  ...range(0x100, 0x17f), // Latin Extended-A — covers "ē" and "ō"
  // Punctuation and symbols in use. A glyph the face does not have is simply
  // left out by Google, so listing one costs nothing.
  ..."‘’‚“”„†‡•…‰′″‹›⁄€₤™←↑→↓−∕×÷",
].join("");

/** family: the css2 `family=` value. Each face becomes one file. */
const FACES = [
  { file: "newsreader-normal.woff2", family: "Newsreader:opsz,wght@6..72,300..600" },
  { file: "newsreader-italic.woff2", family: "Newsreader:ital,opsz,wght@1,6..72,300..600" },
  { file: "ibm-plex-sans-normal.woff2", family: "IBM+Plex+Sans:wght@400..600" },
  { file: "ibm-plex-mono-400.woff2", family: "IBM+Plex+Mono:wght@400" },
  { file: "ibm-plex-mono-500.woff2", family: "IBM+Plex+Mono:wght@500" },
  { file: "source-serif-4-normal.woff2", family: "Source+Serif+4:opsz,wght@8..60,400" },
  { file: "source-serif-4-italic.woff2", family: "Source+Serif+4:ital,opsz,wght@1,8..60,400" },
  { file: "source-sans-3-normal.woff2", family: "Source+Sans+3:wght@400..600" },
  // The Following Jesus pages, served as their reviewed HTML. They asked Google
  // for serif 400 and 600, serif italic 400 and sans 400 to 700, so these cover
  // exactly that; the faces above stay as the other courses use them. "ḥ" is in
  // the Begin transcripts, and the dashes are throughout.
  { file: "fj-source-serif-4-normal.woff2", family: "Source+Serif+4:opsz,wght@8..60,400..600", extra: "ḥ–—" },
  { file: "fj-source-serif-4-italic.woff2", family: "Source+Serif+4:ital,opsz,wght@1,8..60,400", extra: "ḥ–—" },
  { file: "fj-source-sans-3-normal.woff2", family: "Source+Sans+3:wght@400..700", extra: "ḥ–—" },
];

// --only <prefix>: fetch just the faces whose file starts with it, leaving the
// others untouched.
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

console.log();
let changed = 0;
for (const face of FACES) {
  if (only && !face.file.startsWith(only)) continue;
  const chars = CHARS + (face.extra ?? "");
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=${face.family}` +
    `&text=${encodeURIComponent(chars)}&display=swap`;
  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": UA } });
  if (!cssRes.ok) {
    console.error(`  ${face.file}: css request failed — ${cssRes.status}`);
    process.exit(1);
  }
  const css = await cssRes.text();

  // Exactly one face. More than one means Google split the family across files
  // again, and a single file would then silently cover only part of the
  // character set — the thing this approach exists to avoid.
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  if (blocks.length !== 1) {
    console.error(`  ${face.file}: expected 1 @font-face, got ${blocks.length}`);
    process.exit(1);
  }
  const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
  if (!url) {
    console.error(`  ${face.file}: no font url in the response`);
    process.exit(1);
  }

  // What Google says the file holds, against what was asked for. The response
  // carries a unicode-range; next/font/local does not reproduce it, which is
  // harmless (a browser falls back per character for a glyph a font lacks) but
  // does mean this is the only place the coverage can be checked.
  const covered = new Set();
  for (const m of (css.match(/unicode-range:([^;]*);/)?.[1] ?? "").split(",")) {
    const t = m.trim().replace(/^U\+/i, "");
    if (!t) continue;
    if (t.includes("?")) {
      const lo = parseInt(t.replace(/\?/g, "0"), 16);
      const hi = parseInt(t.replace(/\?/g, "f"), 16);
      for (let c = lo; c <= hi; c++) covered.add(c);
    } else {
      const [a, b] = t.split("-").map((x) => parseInt(x, 16));
      for (let c = a; c <= (b ?? a); c++) covered.add(c);
    }
  }
  // A character the face simply has no glyph for is left out by Google, which is
  // information rather than a fault — but a face missing a letter would not be.
  const missing = [...chars].filter((ch) => !covered.has(ch.codePointAt(0)));
  const missingLetters = missing.filter((ch) => /\p{L}/u.test(ch));
  if (missingLetters.length) {
    console.error(`  ${face.file}: no glyph for ${missingLetters.length} letter(s): ${missingLetters.slice(0, 12).join(" ")}`);
    process.exit(1);
  }

  const bin = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
  // woff2 files begin with "wOF2".
  if (bin.subarray(0, 4).toString("latin1") !== "wOF2") {
    console.error(`  ${face.file}: not a woff2 file`);
    process.exit(1);
  }

  const path = join(OUT, face.file);
  const before = existsSync(path) ? readFileSync(path) : null;
  const same = before && before.equals(bin);
  if (!same) changed++;
  if (!check && !same) writeFileSync(path, bin);
  const weight = css.match(/font-weight:\s*([^;]+);/)?.[1].trim() ?? "?";
  const style = css.match(/font-style:\s*([^;]+);/)?.[1].trim() ?? "?";
  console.log(
    `  ${face.file.padEnd(28)} ${String(Math.round(bin.length / 1024)).padStart(4)}KB  ` +
      `weight ${weight.padEnd(9)} ${style.padEnd(7)} ` +
      `${String(covered.size).padStart(3)} glyphs  ` +
      `${same ? "unchanged" : check ? "WOULD CHANGE" : "written"}` +
      (missing.length ? `  (${missing.length} symbol(s) the face lacks)` : "")
  );
}
console.log(
  check
    ? `\n  ${changed} file(s) would change.\n`
    : `\n  ${FACES.length} face(s) in ${OUT}/, ${changed} written.\n`
);
