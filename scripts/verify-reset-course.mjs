#!/usr/bin/env node
// Build assertions for the Christian Spiritual Reset's simple layer.
//
// The 33 pages are declared in lib/reset-simple.ts and written in
// content/courses/christian-spiritual-reset/simple-lessons. Their authority is
// the IMPLEMENTATION NOTE at the foot of each page, which is prose — so the
// checks that matter most here are the ones that hold the code to what those
// notes forbid.
//
// Most of this file is about that. Check-in 1 evaluates three questions about
// suicidal thoughts, panic and flashbacks, and its note says none of it may be
// saved, sent, logged or analysed — not the answers, not the guidance shown,
// not the path taken. Welcome Home's next pause is four cards that must
// schedule nothing. Two opaque codes are stored and their labels never are.
// Those rules are invisible: a page that starts saving an answer looks exactly
// like a page that does not, so nothing but a check like this will notice.
//
// Run with: npm run verify:reset

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CONTENT = join("content", "courses", "christian-spiritual-reset", "simple-lessons");
const LIB = join("lib", "reset-simple.ts");
const ROUTE = join(
  "app", "members", "courses", "christian-spiritual-reset", "simple", "[slug]", "page.tsx"
);
const ACTIONS = join("app", "members", "courses", "christian-spiritual-reset", "actions.ts");

let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const ok = (m) => console.log(`  ok    ${m}`);

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

const lib = read(LIB);
const route = read(ROUTE);
const actions = read(ACTIONS);
if (!lib || !route || !actions) {
  fail("the simple layer's library, route or actions file is missing");
  console.log(`\n${failures} failure(s).\n`);
  process.exit(1);
}

/* ---------------------------------------------- the pages, and their files */

const declared = [...lib.matchAll(/\{ n: \d+, slug: "([^"]+)", file: "([^"]+\.md)"/g)].map(
  (m) => ({ slug: m[1], file: m[2] })
);

if (declared.length !== 33) fail(`lib declares ${declared.length} pages, expected 33`);
else ok("all 33 pages are declared");

const onDisk = existsSync(CONTENT) ? readdirSync(CONTENT).filter((f) => f.endsWith(".md")) : [];
if (onDisk.length !== 33) fail(`${onDisk.length} page files on disk, expected 33`);

let missing = 0;
for (const p of declared) {
  if (!existsSync(join(CONTENT, p.file))) {
    fail(`declared page has no file: ${p.slug} → ${p.file}`);
    missing++;
  }
}
const unused = onDisk.filter((f) => !declared.some((p) => p.file === f));
for (const f of unused) fail(`page file nothing declares: ${f}`);
if (missing === 0 && unused.length === 0) ok("every declared page has a file, and every file a page");

/* ------------------------------------------------------------------ audio */

// Three pages have none by design: the two check-ins and the Day 30 Review ask
// questions and read guidance back, and a recording talked over somebody
// mid-decision.
const silent = declared.filter((p) => {
  const row = new RegExp(`slug: "${p.slug}",[^\\n]*`).exec(lib)?.[0] ?? "";
  return /audio: null/.test(row);
});
const silentSlugs = silent.map((p) => p.slug).sort().join(", ");
if (silentSlugs !== "checkin-01, checkin-02, day-30-review") {
  fail(`pages without audio are "${silentSlugs}", expected the two check-ins and the Day 30 Review`);
} else {
  ok("the three pages without audio are the ones their notes name");
}

/* -------------------------------------------------- Check-in 1's privacy */

const checkin = read(join("components", "reset", "ResetCheckin.tsx"));
if (!checkin) {
  fail("components/reset/ResetCheckin.tsx is missing");
} else {
  // Nothing may leave the browser but ordinary page completion.
  const writes = [
    ["saveResetAnswer", "a written answer"],
    ["saveResetRoute", "the starting-point code"],
    ["saveResetPlan", "the retreat code"],
    ["localStorage", "browser storage"],
    ["sessionStorage", "browser storage"],
    ["fetch(", "a request of its own"],
    ["navigator.sendBeacon", "a beacon"],
  ];
  let leaks = 0;
  for (const [needle, what] of writes) {
    if (checkin.includes(needle)) {
      fail(`Check-in 1 now reaches for ${what} (${needle}) — its answers may not be stored or sent`);
      leaks++;
    }
  }
  const completes = (checkin.match(/setLessonComplete\(/g) ?? []).length;
  if (completes !== 1) {
    fail(`Check-in 1 calls setLessonComplete ${completes} times, expected exactly one`);
    leaks++;
  }
  if (leaks === 0) {
    ok("Check-in 1 stores nothing but ordinary page completion");
  }

  // Guidance A hides the cards and the way on, and marks nothing.
  if (!/shown !== "A"/.test(checkin)) {
    fail("Check-in 1 no longer withholds the path cards under guidance A");
  } else {
    ok("guidance A renders no path cards and no way onward");
  }

  // The order of the rules is the safety in them.
  const rules = read(join("lib", "reset-checkin.ts"));
  if (!rules) {
    fail("lib/reset-checkin.ts is missing");
  } else {
    const a = rules.indexOf('return "A"');
    const b = rules.indexOf('return "B"');
    const c = rules.indexOf('return "C"');
    const d = rules.indexOf('return "D"');
    if (!(a > 0 && a < b && b < c && c < d)) {
      fail("the check-in's rules are no longer applied A, B, C, D in that order");
    } else {
      ok("the check-in applies its rules in the page's own order, most serious first");
    }
    if (/from "@\/lib\/reset-simple"/.test(rules)) {
      fail("lib/reset-checkin.ts imports the disk-reading library, which puts node:fs in the browser");
    } else {
      ok("the check-in's rule stays clear of anything that reads disk");
    }
  }
}

/* ------------------------------------- the next pause, and local checklists */

const local = read(join("components", "reset", "ResetLocalChecks.tsx"));
if (!local) {
  fail("components/reset/ResetLocalChecks.tsx is missing");
} else {
  const bad = ["setLessonComplete", "saveReset", "localStorage", "sessionStorage", "fetch("].filter(
    (n) => local.includes(n)
  );
  if (bad.length) {
    fail(`local checklists now write somewhere (${bad.join(", ")}) — their notes forbid saving them`);
  } else {
    ok("local checklists keep their ticks on the page and write nothing");
  }
}

// Welcome Home's four cards must become local ticks, not a control that saves.
// blocksOf only consumes "[ Card ]" into a saving control where the caller asks
// for plans, and only Lesson 5 asks.
if (!/blocksOf\(body, heading, page\.slug === "lesson-05"\)/.test(route)) {
  fail("the route no longer restricts retreat-plan cards to Lesson 5, so another page's cards could save a code");
} else {
  ok("only Lesson 5's cards store a retreat code; every other page's are local");
}

const wh = read(join(CONTENT, "finish-welcome-home.md"));
if (wh) {
  const cards = (wh.match(/^\*\*\[\s*Card\s*\]/gm) ?? []).length;
  if (cards !== 4) fail(`Welcome Home offers ${cards} next-pause cards, expected 4`);
  else ok("Welcome Home's next pause is four cards");
}

/* --------------------------------------------- the two codes, and no labels */

const routeCodes = /\/\^r\[1-3\]\$\/\.test\(routeId\)/.test(actions);
const planCodes =
  /\/\^\(p3d\|p1d\|p3h\|phome\|pcouple\|pgroup\|pleader\)\$\/\.test\(planId\)/.test(actions);
if (!routeCodes) fail("the starting point no longer rejects anything but r1, r2 and r3");
if (!planCodes) fail("the retreat plan no longer rejects anything but its seven codes");
if (routeCodes && planCodes) ok("both codes are checked before they are stored, and nothing else is accepted");

// A label must never be what gets written for either code. The optional
// written answer is a different thing and does store the learner's own words —
// privately, on their own row, which is what it is for — so the check looks
// inside the two code actions rather than at the file.
const bodyOfFn = (name) => {
  const at = actions.indexOf(`export async function ${name}(`);
  if (at === -1) return null;
  const end = actions.indexOf("\n}", at);
  return end === -1 ? actions.slice(at) : actions.slice(at, end);
};
let labelled = 0;
for (const [fn, code] of [
  ["saveResetRoute", "routeId"],
  ["saveResetPlan", "planId"],
]) {
  const body = bodyOfFn(fn);
  if (!body) {
    fail(`${fn} is gone`);
    labelled++;
  } else if (!new RegExp(`answer:\\s*${code}\\s*,`).test(body)) {
    fail(`${fn} no longer stores its code as the answer — a label may be reaching the row`);
    labelled++;
  }
}
if (labelled === 0) ok("both code actions store the code itself, never the words the learner chose");

if (!/lesson_slug: PLAN_PAGE/.test(actions) || !/lesson_slug: ROUTE_PAGE/.test(actions)) {
  fail("the two codes no longer keep separate rows, so one could overwrite the other");
} else {
  ok("the starting point and the retreat plan keep rows of their own");
}

/* ------------------------------------------------ what a learner may not see */

// The notes are written in italics as well as in HTML comments, and both are
// addressed to whoever builds the page.
for (const [pattern, what] of [
  [/IMPLEMENTATION NOTE\[\\s\\S\]\*\?-->/, "the implementation notes"],
  [/<#\\d\+#>/, "the MiniMax pause cues"],
  [/\\bthe learner\\b/, "notes that speak about “the learner”"],
  [/\\bit has one version\\b/, "notes that announce how many versions a file holds"],
]) {
  if (!pattern.test(lib)) {
    fail(`the library no longer strips ${what} before rendering`);
  }
}
ok("implementation notes, pause cues and italic build notes are all stripped");

// Every control is a marker in the files, and a marker may never render as text.
if (!/export function withoutMarkers/.test(lib)) {
  fail("withoutMarkers is gone, so bracketed labels would render as words in brackets");
} else {
  const prosePaths = (route.match(/withoutMarkers\(/g) ?? []).length;
  if (prosePaths < 4) {
    fail(`only ${prosePaths} prose paths strip markers; a page would show "[ … ]" as text`);
  } else {
    ok(`every prose path strips its markers (${prosePaths} of them)`);
  }
}

/* ------------------------------------------------------- one version, once */

const sessions = declared.filter((p) => p.slug.startsWith("session-"));
if (sessions.length !== 10) fail(`${sessions.length} sessions declared, expected 10`);
let shapes = 0;
for (const s of sessions) {
  const body = read(join(CONTENT, s.file)) ?? "";
  const versions = (body.match(/^## .*VERSION/gm) ?? []).length;
  if (![0, 2, 3].includes(versions)) {
    fail(`${s.slug} has ${versions} version headings, expected none, two or three`);
  } else shapes++;
}
if (shapes === sessions.length) ok("every session holds one, two or three versions, as its file writes them");

if (!/if \(!version\.test\(heading\)\) return null/.test(route)) {
  fail("a session no longer renders only the version for the learner's retreat");
} else {
  ok("a session renders one version and does not send the others to the browser");
}

if (!/if \(!view\.heading\.test\(heading\)\) return null/.test(route)) {
  fail("My Retreat Plan no longer renders only the learner's own plan view");
} else {
  ok("My Retreat Plan renders one view and does not send the others to the browser");
}

// Finishing a short version must not finish the long one.
if (!/export function sessionProgressSlug/.test(lib) || !/\$\{slug\}-\$\{plan\}/.test(lib)) {
  fail("session progress no longer carries the route, so a three-hour session could complete the full one");
} else {
  ok("a session is finished on the route it was taken on, not for every length of itself");
}

/* ------------------------------------------------------------- the flag */

if (!/export const RESET_SIMPLE_PUBLISHED = (true|false);/.test(read(join("lib", "reset-simple-links.ts")) ?? "")) {
  fail("the simple layer's flag is missing");
} else {
  const published = /RESET_SIMPLE_PUBLISHED = true;/.test(
    read(join("lib", "reset-simple-links.ts")) ?? ""
  );
  ok(published ? "the simple layer is published" : "the simple layer is behind its flag, unpublished");
}

/* -------------------------------------------- the certificate, and finishing */

if (!/finish\.finished/.test(route)) {
  fail("Welcome Home no longer decides its acknowledgement from what the learner finished");
} else {
  ok("Welcome Home's acknowledgement is decided by the learner's own progress");
}

if (!/export function routeFinished/.test(lib) || !/ROUTE_REQUIRES/.test(lib)) {
  fail("the completion rules for the three routes are gone");
} else {
  // The Day 30 Review is a follow-up. Finishing may never wait on it.
  if (/"day-30-review"/.test(lib.slice(lib.indexOf("ROUTE_REQUIRES"), lib.indexOf("routeFinished")))) {
    fail("a route now requires the Day 30 Review, which is a follow-up a month later");
  } else {
    ok("no route's completion waits on the Day 30 Review");
  }
}

/* ------------------------------------ the switch: card, home, page counts */

const members = read(join("app", "members", "page.tsx"));
const home = read(join("app", "members", "courses", "[courseSlug]", "page.tsx"));

for (const [src, where, name] of [
  [members, "the members card", "app/members/page.tsx"],
  [home, "the course home", "app/members/courses/[courseSlug]/page.tsx"],
]) {
  if (!src) {
    fail(`${name} is missing`);
    continue;
  }
  if (!/RESET_SIMPLE_PUBLISHED/.test(src)) {
    fail(`${where} does not go through RESET_SIMPLE_PUBLISHED, so it would switch without the flag`);
  } else {
    ok(`${where} switches only behind the flag`);
  }
}

// The course home's branch must be limited to this course, or the other two
// would be served the Reset's overview.
if (home && !/courseSlug === RESET_SLUG && RESET_SIMPLE_PUBLISHED/.test(home)) {
  fail("the course home's branch is not limited to the Reset and the flag together");
} else if (home) {
  ok("only the Reset's own course home switches; the other two are untouched");
}

// Progress is measured against the learner's retreat, not the longest one.
if (!/export function resetRouteProgress/.test(lib)) {
  fail("resetRouteProgress is gone, so a count would have to be against the whole course");
} else if (!/ROUTE_REQUIRES\[plan \?\? "p3d"\]/.test(lib)) {
  fail("progress is no longer counted against the learner's own route");
} else {
  ok("progress is counted against the retreat the learner chose");
}

if (members && !/resetRouteProgress\(/.test(members)) {
  fail("the members card no longer counts the simple layer's own progress");
} else if (members) {
  ok("the members card counts the simple layer, not the 38-page course");
}

/* ------------------------------------------------------- the certificate */

const cert = read(join("lib", "reset-certificate.ts"));
const certRoute = read(
  join("app", "members", "courses", "[courseSlug]", "certificate", "route.ts")
);

if (!cert) {
  fail("lib/reset-certificate.ts is missing");
} else if (!/finish\.kind !== "full"/.test(cert)) {
  fail("the certificate is no longer withheld from the one-day and three-hour routes");
} else {
  ok("the certificate belongs to the full course alone");
}

if (!/finish\.kind === "full"/.test(route)) {
  fail("Welcome Home now offers the certificate on an acknowledgement that is not the full course");
} else {
  ok("Welcome Home offers the certificate only with the full-course acknowledgement");
}

if (!certRoute) {
  fail("the shared certificate route is missing");
} else {
  // The other two courses must be untouched by the Reset's second layer.
  if (!/courseSlug === RESET_SLUG/.test(certRoute)) {
    fail("the certificate route's simple-layer branch is no longer limited to the Reset");
  } else {
    ok("only the Reset consults the simple layer for completion; other courses are unchanged");
  }
  // And a learner who finished the 38-page course keeps their certificate.
  if (!/!completion\.complete && courseSlug === RESET_SLUG/.test(certRoute)) {
    fail("the simple layer now overrides the existing course's completion rather than falling back to it");
  } else {
    ok("the existing course's completion is still tried first and still wins when it holds");
  }
  // The route builds from the member's own record, so a certificate cannot
  // exist for somebody who has not finished, whatever a page believes.
  if (!/if \(!completion\.complete \|\| !completion\.name\)/.test(certRoute)) {
    fail("the certificate route no longer refuses an unfinished or unnamed request");
  } else {
    ok("the certificate route still refuses anyone unfinished or unnamed");
  }
}

// Its note allows the name and the date, and no other personal content.
if (actions.includes("saveResetCertificateName")) {
  const fn = actions.slice(actions.indexOf("export async function saveResetCertificateName"));
  const body = fn.slice(0, fn.indexOf("\n}"));
  const stores = [...body.matchAll(/answer:\s*([A-Za-z_$][\w$.]*)/g)].map((m) => m[1]);
  if (stores.length !== 1 || stores[0] !== "clean") {
    fail(
      `the certificate name action stores ${stores.join(", ") || "nothing"}, expected the trimmed name alone`
    );
  } else {
    ok("the certificate stores a name and nothing else about the learner");
  }
} else {
  fail("saveResetCertificateName is missing, so no name can be printed");
}

console.log(
  failures === 0
    ? "\nThe Christian Spiritual Reset: the simple layer holds to what its notes require.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
