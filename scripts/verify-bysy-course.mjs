#!/usr/bin/env node
// Build assertions for "Before You Say Yes".
//
// This course has no manifest file. Its structure is declared in
// lib/bysy-course.ts, and the authority for that declaration is the file list
// and the navigation document, which are prose. These checks parse both and
// hold the code to them, so a page renamed in the file list or a label changed
// in the navigation shows up as a failure rather than as a silent mismatch.
//
// Run with: npm run verify:bysy

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "before-you-say-yes");
let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const ok = (m) => console.log(`  ok    ${m}`);

/* the file list is the authority on which pages exist, and in what order */

const fileList = readFileSync(join(ROOT, "before-you-say-yes-course-file-list.md"), "utf8");
const listed = [...fileList.matchAll(/^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|/gm)].map((m) => m[1]);

if (listed.length !== 35) fail(`the file list names ${listed.length} pages, expected 35`);
else ok("the file list names 35 pages");

for (const file of listed) {
  if (!existsSync(join(ROOT, file))) fail(`missing page ${file}`);
}
ok(`${listed.length} pages present on disk`);

/* the declaration in lib/bysy-course.ts matches it, in the same order */

const lib = readFileSync(join("lib", "bysy-course.ts"), "utf8");
const declared = [...lib.matchAll(/\{ file: "([^"]+\.md)"/g)].map((m) => m[1]);
const declaredPages = declared.filter((f) => listed.includes(f));

if (declaredPages.length !== 35) {
  fail(`lib/bysy-course.ts declares ${declaredPages.length} of the listed pages, expected 35`);
} else if (declaredPages.join("|") !== listed.join("|")) {
  const firstDiff = declaredPages.findIndex((f, i) => f !== listed[i]);
  fail(`page order diverges at position ${firstDiff + 1}: code has ${declaredPages[firstDiff]}, the file list has ${listed[firstDiff]}`);
} else {
  ok("the code declares the same 35 pages, in the file list's order");
}

/* navigation labels match course-navigation.md */

const nav = readFileSync(join(ROOT, "course-navigation.md"), "utf8");
const navLessons = [...nav.matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|$/gm)]
  .filter(([, n]) => Number(n) >= 1 && Number(n) <= 20)
  .map(([, n, label]) => [Number(n), label]);

let labelMismatch = 0;
for (const [n, label] of navLessons) {
  // The code stores the label verbatim; quotes in it are escaped for TypeScript.
  const inCode = lib.includes(label) || lib.includes(label.replace(/"/g, '\\"'));
  if (!inCode) { labelMismatch++; fail(`lesson ${n} label not found in the code: ${label}`); }
}
if (labelMismatch === 0) ok(`${navLessons.length} lesson labels match course-navigation.md`);

/* the four pause pages are labelled by their own titles, not "Module N pause" */

for (const title of ["Am I Ready to Date?", "What Have I Actually Observed?",
                     "Patterns, Not Isolated Impressions", "What Does the Evidence Require?"]) {
  if (!lib.includes(title)) fail(`pause page not labelled by its own title: ${title}`);
}
ok("the four pauses are labelled by their own titles");

/* route lengths match the table in course-navigation.md */

const routeLengths = Object.fromEntries(
  [...nav.matchAll(/^\|\s*(I am not dating yet|I have recently started dating|I am deciding whether to continue|We are considering engagement|The complete course)\s*\|\s*(\d+)\s*\|$/gm)]
    .map(([, label, n]) => [label, Number(n)])
);
const expectedRoutes = {
  "I am not dating yet": 15,
  "I have recently started dating": 26,
  "I am deciding whether to continue": 13,
  "We are considering engagement": 14,
  "The complete course": 35,
};
for (const [label, n] of Object.entries(expectedRoutes)) {
  if (routeLengths[label] !== n) {
    fail(`route "${label}" is ${routeLengths[label]} pages in course-navigation.md, the code assumes ${n}`);
  }
}
ok("route lengths agree with course-navigation.md");

/* no implementation comment survives into anything rendered */

let withComments = 0;
for (const file of readdirSync(ROOT).filter((f) => f.endsWith(".md"))) {
  if (/build-notes|file-list/.test(file)) continue;   // process documents, not pages
  const raw = readFileSync(join(ROOT, file), "utf8");
  if (/Remove this note before publishing/i.test(raw)) withComments++;
}
ok(`${withComments} pages still carry an implementation comment in source (stripped at render)`);

/* §4: no analytics label anywhere in the course code may name a safety concern */

const FORBIDDEN = /\b(abuse|afraid|fear|coerc|forced[_ -]?marriage|leaving|safety[_ -]?concern)\w*\s*[:=]\s*["'`]|["'`][^"'`]*\b(abuse_|exit_plan|afraid_to|fear_)/i;
const codeFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(p)) codeFiles.push(p);
  }
};
for (const dir of [join("lib"), join("app", "members", "courses")]) if (existsSync(dir)) walk(dir);
let flagged = 0;
for (const f of codeFiles) {
  if (!/bysy|before-you-say-yes/i.test(f + readFileSync(f, "utf8").slice(0, 400))) continue;
  if (FORBIDDEN.test(readFileSync(f, "utf8"))) { flagged++; fail(`${f} may carry a safety-naming analytics label`); }
}
if (flagged === 0) ok("no safety-naming event label in the course code");

/* the descriptive route label must never be what gets stored */

if (/answer:\s*route\.label|answer:\s*label|\.label\s*\}\s*\)/.test(lib)) {
  fail("a route's descriptive label appears to be stored — it must be the opaque id");
}
ok("routes are stored by opaque id, never by label");

console.log(
  failures === 0
    ? "\nBefore You Say Yes: structure matches the file list and the navigation document.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
