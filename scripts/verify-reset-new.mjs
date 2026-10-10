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


// My Day 30 Review (Lesson 16): the one other thing this edition saves, in its own file.
const rv = readFileSync(join(root, "lib/reset-new-review.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const rvTables = [...rv.matchAll(/\.from\("([^"]+)"\)/g)].map((m) => m[1]);
check(rvTables.length && rvTables.every((t) => t === "course_private_answers"), "review touches only: course_private_answers", `review touches: ${rvTables.join(", ")}`);
check(!(/\.update\(|\.rpc\(|supabaseAdmin|service_role/.test(rv)), "review never updates in bulk, calls a database function or uses the admin key", "review uses update, rpc or the admin key");
check(/REVIEW_PAGE = "day-30-review"/.test(rv), "review page key is day-30-review", "review page key changed");
const rvWrites = [...rv.matchAll(/course_slug:\s*([\w"'-]+)/g)].map((m) => m[1]);
check(rvWrites.length && rvWrites.every((w) => w === "RESET_NEW_KEY") && [...rv.matchAll(/page_slug:\s*([\w"'-]+)/g)].every((m) => m[1] === "REVIEW_PAGE"), "review writes only this edition's day-30-review rows", "review writes other rows");
const rvReads = [...rv.matchAll(/\.eq\("(course_slug|page_slug)",\s*([\w"'-]+)\)/g)].map((m) => m[2]);
check(rvReads.length && rvReads.every((r) => r === "RESET_NEW_KEY" || r === "REVIEW_PAGE"), "review reads only this edition's day-30-review rows", `review reads ${rvReads.join(", ")}`);
const deletes = rv.split(".delete()").slice(1).map((d) => d.slice(0, d.indexOf(";")));
check(deletes.length && deletes.every((d) => d.includes('.eq("user_id", learner.userId)') && d.includes('.eq("course_slug", RESET_NEW_KEY)') && d.includes('.eq("page_slug", REVIEW_PAGE)')), "review deletes only the member's own day-30-review rows", "a review delete is not limited to the member's own review");
check(!(/journal|course_reflections|course_progress|certificate/.test(rv)), "review never touches progress, the journal, reflections or certificates", "review mentions progress, the journal, reflections or certificates");

console.log(failed ? `\n${failed} problem(s).` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
