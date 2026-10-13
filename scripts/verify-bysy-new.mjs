#!/usr/bin/env node
// Checks the hidden Before You Say Yes new edition: its pages are the reviewed
// files, and its code can only touch its own progress rows.
// Run: node scripts/verify-bysy-new.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.cwd();
const dir = join(root, "content/courses/before-you-say-yes-new");
let failed = 0;
const fail = (m) => { failed++; console.error("FAIL", m); };
const ok = (m) => console.log("ok  ", m);
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));

const lines = readFileSync(join(dir, "CHECKSUMS.sha256"), "utf8").trim().split("\n");
check(lines.length === 42, "42 reviewed files listed (21 pages, 21 players)", `${lines.length} files listed, expected 42`);
for (const line of lines) {
  const [sum, file] = line.split(/\s+/);
  const now = createHash("sha256").update(readFileSync(join(dir, file))).digest("hex");
  check(now === sum, `unchanged: ${file}`, `changed since review: ${file}`);
}

// No reflection is saved: the pages themselves never store or send what is typed.
for (const line of lines) {
  const file = line.split(/\s+/)[1];
  if (!file.endsWith("page.html")) continue;
  const html = readFileSync(join(dir, file), "utf8");
  check(!/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon/.test(html),
    `${file}: stores and sends nothing`, `${file}: has storage or network code`);
}

const code = [join(root, "lib/bysy-new.ts")];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else code.push(p);
});
walk(join(root, "app/members/courses/before-you-say-yes-new"));
const all = code.map((f) => readFileSync(f, "utf8")).join("\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const tables = [...all.matchAll(/\.from\("([^"]+)"\)/g)].map((m) => m[1]);
check(tables.every((t) => t === "course_progress"), `touches only: ${[...new Set(tables)].join(", ")}`, `touches other tables: ${tables.join(", ")}`);
check(!(/\.delete\(|\.update\(|\.rpc\(/.test(all)), "never deletes, updates or calls a database function", "deletes, updates or calls a database function");
const writes = [...all.matchAll(/course_slug:\s*([\w"'-]+)/g)].map((m) => m[1]);
check(writes.length && writes.every((w) => w === "BYSY_NEW_KEY"), "writes only course_slug before-you-say-yes-new", `writes course_slug ${writes.join(", ")}`);
const reads = [...all.matchAll(/\.eq\("course_slug",\s*([\w"'-]+)/g)].map((m) => m[1]);
check(reads.length && reads.every((r) => r === "BYSY_NEW_KEY"), "reads only its own progress", `reads course_slug ${reads.join(", ")}`);
check(/BYSY_NEW_KEY = "before-you-say-yes-new"/.test(all), "course key is before-you-say-yes-new", "course key changed");
check(!(/course_reflections|course_private_answers|journal/.test(all)), "never touches reflections, private answers or the journal", "mentions reflections, private answers or the journal");

console.log(failed ? `\n${failed} problem(s).` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
