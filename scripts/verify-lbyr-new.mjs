#!/usr/bin/env node
// Checks the Lead Before You're Ready new edition: its pages are Richmond's
// finished files, nothing typed on them is saved or sent, and its code can
// only touch its own progress rows.
//
//   npm run verify:lbyr-new   (tsx runs it, for the TypeScript in lib/)
//
// Pages are built from the files as the site serves them, with placeholder
// Supabase settings (see package.json), so nothing here can reach the
// database or storage.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import * as Lbyr from "../lib/lbyr-new.ts";
import { LBYR_NEW_LIVE } from "../lib/lbyr-new-live.ts";

const root = process.cwd();
const dir = join(root, "content/courses/lead-before-youre-ready-new");
let failed = 0;
const fail = (m) => { failed++; console.error("FAIL", m); };
const ok = (m) => console.log("ok  ", m);
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));

/* ---------------------------------------------- the files are the finished ones */

const lines = readFileSync(join(dir, "CHECKSUMS.sha256"), "utf8").trim().split("\n");
const added = Lbyr.LBYR_NEW_UNITS.filter(Lbyr.unitAdded);
const expected = 2 + added.length * 2 + (lines.some((l) => l.endsWith("my-leadership-plan.html")) ? 1 : 0);
check(lines.length === expected, `${lines.length} finished files listed`, `${lines.length} files listed, expected ${expected}`);
for (const line of lines) {
  const [sum, file] = line.split(/\s+/);
  const now = createHash("sha256").update(readFileSync(join(dir, file))).digest("hex");
  check(now === sum, `unchanged: ${file}`, `changed since copied: ${file}`);
}

/* ------------------------------------------------- nothing typed is saved or sent */

const STORES_OR_SENDS = /localStorage|sessionStorage|indexedDB|document\.cookie|XMLHttpRequest|sendBeacon|new WebSocket|EventSource|navigator\.sendBeacon/;
const read = (f) => readFileSync(join(dir, f), "utf8");

// The players do two things of their own, and only these: fetch their own
// recording once, so seeking is smooth, and remember the "still slides"
// (reduce motion) setting in the browser. Neither touches anything typed.
const PLAYER_OWN = [
  "fetch(url).then(",
  "localStorage.getItem('lbyr-reduce-motion')",
  "localStorage.setItem('lbyr-reduce-motion',",
];
const withoutPlayerOwn = (html) => PLAYER_OWN.reduce((h, s) => h.split(s).join(""), html);

// The finished files themselves.
for (const line of lines) {
  const file = line.split(/\s+/)[1];
  const html = file.endsWith("player.html") ? withoutPlayerOwn(read(file)) : read(file);
  check(!STORES_OR_SENDS.test(html) && !/fetch\(/.test(html), `${file}: stores and sends nothing${file.endsWith("player.html") ? " beyond its recording and motion setting" : ""}`, `${file}: has storage or network code`);
}

// The pages as served: the only request any of them can make is "complete",
// with no body; nothing from Google or anywhere else; no placeholder or Mac links.
const served = [
  ["welcome (visitor)", Lbyr.welcomeHtml(read("welcome.html"), { signedIn: false, active: false })],
  ["welcome (member)", Lbyr.welcomeHtml(read("welcome.html"), { signedIn: true, active: true })],
  ["how-this-course-works", Lbyr.howHtml(read("how-this-course-works.html"))],
  ["course page", Lbyr.homeHtml(new Map())],
  ["my-leadership-plan", Lbyr.planHtml(read("my-leadership-plan.html"), new Map([["lesson-01", "2026-10-20T09:00:00Z"]]))],
  ...added.flatMap((u) => [
    [`${u.slug}`, Lbyr.unitHtml(u, read(`${u.slug}/page.html`), new Map())],
    [`${u.slug} (completed)`, Lbyr.unitHtml(u, read(`${u.slug}/page.html`), new Map([[u.slug, "2026-10-20T09:00:00Z"]]))],
    [`${u.slug}/player`, Lbyr.playerHtml(u, read(`${u.slug}/player.html`))],
  ]),
];
for (const [name, page] of served) {
  const html = name.endsWith("/player") ? withoutPlayerOwn(page) : page;
  check(!STORES_OR_SENDS.test(html), `${name}: no storage or background sending`, `${name}: has storage or sending code`);
  const fetches = html.match(/fetch\(/g) ?? [];
  const isLesson = /^lesson-\d\d( \(completed\))?$/.test(name);
  check(
    isLesson ? fetches.length === 1 && /fetch\("[^"]+\/complete",\{method:'POST',credentials:'same-origin'\}\)/.test(html) : fetches.length === 0,
    `${name}: ${isLesson ? "one request, to /complete, with no body" : "no requests"}`,
    `${name}: unexpected requests (${fetches.length})`
  );
  check(!/googleapis|gstatic|vercel|analytics|gtag|plausible/i.test(html), `${name}: nothing from Google, no analytics`, `${name}: loads something from outside the site`);
  check(!/href="#concerns"|<a [^>]*href="#|02%20Lessons|\.html"/.test(html), `${name}: no placeholder or file links left`, `${name}: a placeholder or file link is left`);
  // Once live, the Welcome page alone is open to search engines.
  if (name.startsWith("welcome") && LBYR_NEW_LIVE) {
    check(!/noindex/.test(html) && /rel="canonical" href="https:\/\/faithfulpathcommunity\.com\/members\/courses\/lead-before-youre-ready-new\/welcome"/.test(html),
      `${name}: open to search engines, with its canonical address`, `${name}: still noindex, or no canonical`);
    for (const tag of ['property="og:url" content="https://faithfulpathcommunity.com/members/courses/lead-before-youre-ready-new/welcome"',
      'property="og:image" content="https://faithfulpathcommunity.com/og-lead-before-youre-ready.png"', 'property="og:title"', 'property="og:description"', 'name="twitter:card" content="summary_large_image"']) {
      check(html.includes(tag), `${name}: share preview has ${tag.split(" ")[0]}`, `${name}: share preview is missing ${tag}`);
    }
    check(/<title>Welcome · Lead Before You’re Ready<\/title>/.test(html), `${name}: tab title as the approved file has it`, `${name}: tab title changed`);
  } else check(/noindex/.test(html), `${name}: noindex`, `${name}: missing noindex`);
  check(!/Test edition/.test(html) || !LBYR_NEW_LIVE, `${name}: no test-edition note`, `${name}: still says "Test edition"`);
}

// My Leadership Plan: the record goes in before the page's own script, as
// dates, and only what was completed.
const planWith = (m) => Lbyr.planHtml(read("my-leadership-plan.html"), new Map(m));
const recordAt = (html) => html.indexOf("window.LBYR_PROGRESS=");
const pageScriptAt = (html) => html.indexOf("/* Completion record.");
const all10 = Lbyr.LBYR_NEW_UNITS.map((u, i) => [u.slug, `2026-${String(10 + Math.floor(i / 5)).padStart(2, "0")}-${String(20 + (i % 5)).padStart(2, "0")}T09:00:00Z`]);
for (const [label, m] of [["none", []], ["one", [["lesson-03", "2026-10-21T09:00:00Z"]]], ["all ten", all10]]) {
  const html = planWith(m);
  check(recordAt(html) > 0 && recordAt(html) < pageScriptAt(html), `plan (${label}): progress supplied before the page's script`, `plan (${label}): progress not supplied first`);
  const times = JSON.parse(/var t=(\{[^}]*\})/.exec(html)[1]);
  check(Object.keys(times).length === m.length, `plan (${label}): ${m.length} lesson(s) in the record`, `plan (${label}): record has ${Object.keys(times).length} lessons`);
}
check(!/href="#talk-to-a-pastor"|href="#courses"/.test(planWith([])) && /href="\/talk-to-a-pastor"/.test(planWith([])) && /href="\/courses"/.test(planWith([])),
  "plan: Talk to a Pastor and Other courses go to the site's pages", "plan: Talk to a Pastor or Other courses not linked");
check(/Nothing you write is saved to your account/.test(read("my-leadership-plan.html")), "plan: says nothing written is saved", "plan lost its privacy promise");

// Progress dots readable by screen readers; darker gold for text on the cream slides.
for (const u of added) {
  const page = Lbyr.unitHtml(u, read(`${u.slug}/page.html`), new Map());
  check(/<span class="steps21" role="img" aria-label="Step \d+ of 10">/.test(page), `${u.slug}: progress dots have a role`, `${u.slug}: progress dots have no role`);
  check(Lbyr.playerHtml(u, read(`${u.slug}/player.html`)).includes("<style data-lbyr>.refrain,.num{color:#8a6a24}</style>"),
    `${u.slug}/player: darker gold for refrains and numbers`, `${u.slug}/player: darker gold missing`);
}

// The pages keep their promises about the writing.
check(/Your written answers are not saved to your account/.test(read("how-this-course-works.html")),
  "How This Course Works: says written answers are not saved", "How This Course Works lost its privacy promise");
for (const u of added) {
  check(/Nothing you type is saved/.test(read(`${u.slug}/page.html`)), `${u.slug}: says nothing typed is saved`, `${u.slug}: lost its "Nothing you type is saved" notice`);
}

/* ------------------------------------------------ the code touches only its own rows */

const code = [join(root, "lib/lbyr-new.ts")];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else code.push(p);
});
walk(join(root, "app/members/courses/lead-before-youre-ready-new"));
const all = code.map((f) => readFileSync(f, "utf8")).join("\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const tables = [...all.matchAll(/\.from\("([^"]+)"\)/g)].map((m) => m[1]);
check(tables.every((t) => t === "course_progress"), `touches only: ${[...new Set(tables)].join(", ")}`, `touches other tables: ${tables.join(", ")}`);
check(!(/\.delete\(|\.update\(|\.rpc\(|\.remove\(/.test(all)), "never deletes, updates or removes anything", "deletes, updates or removes something");
const writes = [...all.matchAll(/course_slug:\s*([\w"'-]+)/g)].map((m) => m[1]);
check(writes.length && writes.every((w) => w === "LBYR_NEW_KEY"), "writes only course_slug lead-before-youre-ready-new", `writes course_slug ${writes.join(", ")}`);
const reads = [...all.matchAll(/\.eq\("course_slug",\s*([\w"'-]+)/g)].map((m) => m[1]);
check(reads.length && reads.every((r) => r === "LBYR_NEW_KEY"), "reads only its own progress", `reads course_slug ${reads.join(", ")}`);
check(/LBYR_NEW_KEY = "lead-before-youre-ready-new"/.test(all), "course key is lead-before-youre-ready-new", "course key changed");
check(!(/course_reflections|course_private_answers|journal|request\.(json|text|formData)\(/.test(all)),
  "never touches reflections or the journal, and reads no request body", "mentions reflections or the journal, or reads a request body");
check(!(/\.upload\(/.test(all)), "never uploads", "uploads something");

console.log(failed ? `\n${failed} problem(s).` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
