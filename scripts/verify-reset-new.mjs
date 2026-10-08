#!/usr/bin/env node
// Checks the hidden Reset edition: its pages are the reviewed files, and its
// code can only touch its own progress rows. Run: node scripts/verify-reset-new.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.cwd();
const dir = join(root, "content/courses/christian-spiritual-reset-new");
let failed = 0;
const fail = (m) => { failed++; console.error("FAIL", m); };
const ok = (m) => console.log("ok  ", m);
const check = (cond, good, bad) => {
  if (cond) ok(good);
  else fail(bad);
};

for (const line of readFileSync(join(dir, "CHECKSUMS.sha256"), "utf8").trim().split("\n")) {
  const [sum, file] = line.split(/\s+/);
  const now = createHash("sha256").update(readFileSync(join(dir, file))).digest("hex");
  check(now === sum, `unchanged: ${file}`, `changed since review: ${file}`);
}

const code = [join(root, "lib/reset-new.ts")];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else code.push(p);
});
walk(join(root, "app/members/courses/christian-spiritual-reset-new"));
// Code only: comments describe the live course and the journal by name.
const all = code.map((f) => readFileSync(f, "utf8")).join("\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const tables = [...all.matchAll(/\.from\("([^"]+)"\)/g)].map((m) => m[1]);
const allowed = new Set(["course_progress", "course-media"]);
check(tables.every((t) => allowed.has(t)), `touches only: ${[...new Set(tables)].join(", ")}`, `touches other tables: ${tables.join(", ")}`);
check(!(/\.delete\(|\.update\(|\.rpc\(/.test(all)), "never deletes, updates or calls a database function", "deletes, updates or calls a database function");
const writes = [...all.matchAll(/course_slug:\s*([\w"'-]+)/g)].map((m) => m[1]);
check(writes.length && writes.every((w) => w === "RESET_NEW_KEY"), "writes only course_slug christian-spiritual-reset-new", `writes course_slug ${writes.join(", ")}`);
const reads = [...all.matchAll(/\.eq\("course_slug",\s*([\w"'-]+)/g)].map((m) => m[1]);
check(reads.length && reads.every((r) => r === "RESET_NEW_KEY"), "reads only its own progress", `reads course_slug ${reads.join(", ")}`);
check(/RESET_NEW_KEY = "christian-spiritual-reset-new"/.test(all), "course key is christian-spiritual-reset-new", "course key changed");
check(!(/journal|course_reflections/.test(all)), "never touches the journal or reflections", "mentions the journal or reflections");

console.log(failed ? `\n${failed} problem(s).` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
