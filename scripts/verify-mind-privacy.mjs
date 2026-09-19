#!/usr/bin/env node
// Privacy and non-gating assertions for "When Your Mind Won't Rest".
//
// These are the promises the course map makes that are easy to break later
// without noticing: a console.log added while debugging, a worksheet quietly
// made to count, a lock introduced by a well-meant "you must finish X first".
// Each one is checked against the code and the manifest, not against intent.
//
// Run with: npm run verify:privacy

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "when-your-mind-wont-rest");
const manifest = JSON.parse(readFileSync(join(ROOT, "course.json"), "utf8"));

let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const ok = (m) => console.log(`  ok    ${m}`);

/** Every source file under a directory. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(path)) out.push(path);
  }
  return out;
}

const courseFiles = [
  ...walk(join("app", "members", "courses", "when-your-mind-wont-rest")),
  ...walk(join("components", "mind")),
  "lib/mind-course.ts",
  "lib/mind-progress.ts",
  "lib/mind-journal.ts",
  "lib/mind-certificate.ts",
  "lib/mind-types.ts",
  "lib/mind-links.ts",
];
const source = new Map(courseFiles.map((f) => [f, readFileSync(f, "utf8")]));

/* ---- privacy: answers never reach a log, an analytics call or an alert ---- */

// Any console call that mentions an answer-shaped variable.
const ANSWER_WORDS = /\b(answer|answers|question|reflection|intention|entries|values|note|text|question_index)\b/;
for (const [file, code] of source) {
  for (const match of code.matchAll(/console\.\w+\(([^)]*)\)/g)) {
    if (ANSWER_WORDS.test(match[1])) {
      fail(`${file} logs something answer-shaped: console(${match[1].slice(0, 60)})`);
    }
  }
}
ok("no console call in the course code carries an answer");

for (const [file, code] of source) {
  if (/\b(gtag|fbq|analytics|track\(|posthog|mixpanel|datadog|sentry)\b/i.test(code)) {
    fail(`${file} references an analytics or telemetry call`);
  }
}
ok("no analytics or telemetry anywhere in the course code");

// "Writing that you need help alerts no one" — so there is no alerting to find.
for (const [file, code] of source) {
  if (/resend|sendgrid|mailerlite|nodemailer|api\.resend\.com|sendMail|notifyAdmin|webhook/i.test(code)) {
    fail(`${file} contains something that could notify someone`);
  }
}
ok("nothing in the course code can notify anyone — no alerting exists");

/* ------- privacy: answers are never rendered as markup, only as text ------- */

for (const [file, code] of source) {
  if (/dangerouslySetInnerHTML/.test(code)) {
    fail(`${file} uses dangerouslySetInnerHTML`);
  }
}
ok("no dangerouslySetInnerHTML in the course code — member text is escaped by React");

// Member writing must never be fed to the Markdown renderer, which would let a
// member's own text become markup.
for (const [file, code] of source) {
  for (const match of code.matchAll(/<MindMarkdown\s+source=\{([^}]+)\}/g)) {
    // linkCourseReferences only turns known page titles into links; look
    // through it to whatever it was handed, so the check stays on the source.
    const expr = match[1].trim().replace(/^linkCourseReferences\(\s*([^,)]+).*$/, "$1");
    // Each of these is a slice of a course file, vetted once here so that a new
    // one has to be added deliberately rather than slipping in:
    //   file.body / page.body  whole file
    //   main / chapter         splitChapter
    //   before / after         splitPauseQuestions
    //   notice / rest          splitFirstNotice
    //   support                a lesson's front-matter support note
    const allowed = /^(file\.body|page\.body|main|chapter|before|after|notice|rest|support)$/.test(expr);
    if (!allowed) fail(`${file} renders '${expr}' as Markdown — is it member input?`);
  }
}
ok("every Markdown source is course content, never member input");

/* ------------------ privacy: admin never reads member answers ------------- */

const adminFiles = [...walk(join("app", "admin")), ...walk(join("components", "admin"))];
for (const file of adminFiles) {
  const code = readFileSync(file, "utf8");
  if (/course_reflections|course_progress|course_day_progress/.test(code)) {
    fail(`${file} queries a member-answer table from the admin area`);
  }
}
ok(`${adminFiles.length} admin files, none of which reads a member-answer table`);

/* --------- privacy: every read is the member's own, via the anon client ---- */

// The service-role client bypasses RLS. It must not appear anywhere a member's
// own rows are read or written.
for (const [file, code] of source) {
  if (/supabaseAdmin|SUPABASE_SERVICE_ROLE_KEY/.test(code)) {
    fail(`${file} uses the service-role client, which bypasses RLS`);
  }
}
ok("no service-role client in the course code — RLS scopes every read");

/* --------------------------- non-gating: the manifest --------------------- */

if (manifest.no_prerequisite_locks !== true) fail("manifest no longer declares no_prerequisite_locks");
ok("manifest declares no prerequisite locks");

const checkins = manifest.modules.flatMap((m) => m.checkins ?? []);
for (const checkin of checkins) {
  if (checkin.scored) fail(`${checkin.file} is scored`);
  if (checkin.required) fail(`${checkin.file} is required`);
  if (checkin.gates_completion) fail(`${checkin.file} gates completion`);
  if (checkin.affects_certificate) fail(`${checkin.file} affects the certificate`);
}
ok(`${checkins.length} check-ins: none scored, required, gating or certificate-affecting`);

for (const resource of manifest.resources) {
  if (resource.counts_towards_completion) fail(`${resource.file} counts towards completion`);
  if (!resource.never_prompt_repeat) fail(`${resource.file} may prompt a repeat`);
}
ok(`${manifest.resources.length} worksheets: none counts, none prompts a repeat`);

const excluded = manifest.completion.certificate.excludes ?? [];
for (const must of ["Module 0", "module pauses", "check-ins", "journal responses", "worksheets", "Module 5"]) {
  if (!excluded.some((e) => e.toLowerCase().includes(must.toLowerCase().split(" ")[0]))) {
    fail(`the certificate no longer excludes ${must}`);
  }
}
ok("the certificate still excludes everything but the twenty-one lessons");

/* ------------- non-gating: the certificate route reads nothing else -------- */

const certRoute = source.get(
  join("app", "members", "courses", "when-your-mind-wont-rest", "certificate", "route.ts")
);
for (const forbidden of ["getJourneyProgress", "findCheckin", "getCheckins", "findResource", "CHECKIN_INDEX", "PATTERN_FINDER_INDEX"]) {
  if (certRoute?.includes(forbidden)) {
    fail(`the certificate route reads ${forbidden}, which must not affect eligibility`);
  }
}
ok("the certificate route reads only the twenty-one lessons and the name");

/* --------------- non-gating: no route refuses a page for order ------------- */

// A lock would look like a redirect conditioned on another page's progress.
// Comments are stripped first: the routes explain at length that there are no
// prerequisites, and an assertion that trips over the word in a sentence saying
// there are none is testing prose, not behaviour.
const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

for (const [file, code] of source) {
  if (!file.includes("lessons") && !file.includes("checkins") && !file.includes("resources")) continue;
  const bare = stripComments(code);
  if (/redirect\([^)]*\)\s*;?[\s\S]{0,80}(finished|completed|locked|prerequisite)/i.test(bare)) {
    fail(`${file} may redirect based on another page's progress`);
  }
  if (/\blocked\b|\bprerequisite\b/i.test(bare)) {
    fail(`${file} has locking or prerequisite logic`);
  }
}
ok("no lesson, check-in or worksheet route locks on another page's progress");

/* ---------------- the journey never nags, streaks or scores --------------- */

const status = manifest.modules.find((m) => m.id === "m5").status_config;
for (const [key, expected] of [
  ["no_streaks", true], ["no_overdue", true], ["no_catch_up", true],
  ["no_emotional_scoring", true], ["opening_marks_complete", false],
  ["need_support_marks_complete", false], ["need_support_sends_notification", false],
  ["any_day_openable_without_calendar_date", true],
  ["progress_stored_separately_from_foundation", true],
]) {
  if (status[key] !== expected) fail(`journey status_config.${key} is ${status[key]}, expected ${expected}`);
}
if (status.progress_wording !== "x of 30 days visited") {
  fail(`journey progress wording changed: ${status.progress_wording}`);
}
ok("the journey still has no streaks, no overdue, no catch-up and no scoring");

/* Membership lookup: an email is matched case-insensitively, which means
   ILIKE, which means the search term is a pattern — and `_` and `%` are legal
   in the local part of an address and are wildcards to Postgres. Someone
   signing in as `a_b@example.com` was handed the membership belonging to
   `axb@example.com`, demonstrated against the real table. The escaping is the
   fix; this is what stops it being undone by someone reading `emailPattern` as
   needless ceremony. */

const members = readFileSync(join("lib", "members.ts"), "utf8");
const bareIlike = [...members.matchAll(/\.ilike\(\s*"email"\s*,\s*([^)]+)\)/g)]
  .map((m) => m[1].trim())
  .filter((arg) => !arg.startsWith("emailPattern("));

if (bareIlike.length > 0) {
  for (const arg of bareIlike) {
    fail(`lib/members.ts matches an email with ilike on ${arg} — _ and % in an address are wildcards, and would match another member's row`);
  }
} else if (!/function emailPattern/.test(members)) {
  fail("lib/members.ts has lost emailPattern — email lookups would match wildcards again");
} else {
  ok("email lookups escape ILIKE wildcards before matching");
}

console.log(
  failures === 0
    ? "\nWhen Your Mind Won't Rest: privacy and non-gating assertions hold.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
