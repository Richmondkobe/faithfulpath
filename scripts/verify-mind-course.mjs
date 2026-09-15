#!/usr/bin/env node
// Build assertions for "When Your Mind Won't Rest".
//
// course.json is the contract, and the content on disk has to match it. These
// checks are the ones where a silent mismatch would show up as a missing page
// or a dead worksheet link rather than as an error — including the one the
// course map asks for by name: the visible list on "My Mind Is Restless Right
// Now" is generated from the `entries` front matter, and the Markdown list
// below it is only a fallback, so the two must agree.
//
// Run with: npm run verify:mind

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "when-your-mind-wont-rest");
const manifest = JSON.parse(readFileSync(join(ROOT, "course.json"), "utf8"));

let failures = 0;
const fail = (message) => {
  console.error(`  FAIL  ${message}`);
  failures++;
};
const ok = (message) => console.log(`  ok    ${message}`);

/* every page, check-in, worksheet and download the manifest names exists */

const pages = manifest.modules.flatMap((m) => m.pages);
for (const page of pages) {
  if (!existsSync(join(ROOT, page.file))) fail(`missing page ${page.file}`);
}
ok(`${pages.length} page files present`);

const checkins = manifest.modules.flatMap((m) => m.checkins ?? []);
for (const checkin of checkins) {
  if (!existsSync(join(ROOT, checkin.file))) fail(`missing check-in ${checkin.file}`);
}
ok(`${checkins.length} check-ins present`);

const byFilename = new Map();
for (const resource of manifest.resources) {
  if (!existsSync(join(ROOT, resource.file))) fail(`missing worksheet ${resource.file}`);
  const filename = resource.file.split("/").pop();
  if (byFilename.has(filename)) fail(`two worksheets share the filename ${filename}`);
  byFilename.set(filename, resource.file);
}
ok(`${manifest.resources.length} worksheets present, filenames unique`);

for (const download of manifest.downloads) {
  const file = download.file ?? download;
  if (!existsSync(join(ROOT, file))) fail(`missing download ${file}`);
}
ok(`${manifest.downloads.length} download(s) present`);

/* worksheet references resolve by filename against the registry, never
   relative to the lesson's own directory — see resource_path_resolution */

let references = 0;
for (const page of pages) {
  for (const reference of page.resources ?? []) {
    references++;
    if (!byFilename.has(reference.split("/").pop())) {
      fail(`unresolved worksheet reference ${reference} on ${page.file}`);
    }
  }
}
ok(`${references} worksheet references all resolve`);

/* the certificate counts 21 lessons, each with a finish label */

const counting = manifest.modules
  .filter((m) => m.counts_towards_completion)
  .flatMap((m) => m.pages);
if (counting.length !== 21) fail(`${counting.length} counting lessons, expected 21`);
for (const lesson of counting) {
  if (!lesson.finish_label) fail(`no finish_label on ${lesson.file}`);
}
ok(`${counting.length} counting lessons, all with a finish label`);

/* the journey is thirty contiguous days */

const journey = manifest.modules.find((m) => m.id === "m5");
const days = journey.pages.map((p) => p.day).sort((a, b) => a - b);
if (days.length !== 30) fail(`${days.length} journey days, expected 30`);
days.forEach((day, i) => {
  if (day !== i + 1) fail(`journey day sequence breaks at ${day}`);
});
ok(`${days.length} journey days, contiguous`);

/* the restless-now list is generated from `entries`; the Markdown list under
   it is a fallback, and the two must say the same things */

const restless = readFileSync(
  join(ROOT, "m0", "lessons", "07-my-mind-is-restless-right-now.md"),
  "utf8"
);
const entryTexts = [...restless.matchAll(/^\s*-\s+text:\s*"(.+?)"\s*$/gm)].map((m) => m[1]);
const body = restless.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
const markdownItems = [...body.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map((m) => m[1].trim());

if (entryTexts.length === 0) fail("no `entries` front matter on the restless-now page");
if (entryTexts.length !== markdownItems.length) {
  fail(
    `restless-now: ${entryTexts.length} entries but ${markdownItems.length} Markdown items`
  );
}
for (const text of entryTexts) {
  if (!markdownItems.some((item) => item.includes(text) || text.includes(item))) {
    fail(`restless-now entry missing from the Markdown fallback: "${text}"`);
  }
}
ok(`restless-now: ${entryTexts.length} entries match the Markdown fallback`);

/* a worksheet that needs its safety box says so in both places, or the page
   could render prompts without it */

let mismatched = 0;
for (const resource of manifest.resources) {
  const raw = readFileSync(join(ROOT, resource.file), "utf8");
  const inFile = /^resource_safety_required:\s*true\s*$/m.test(raw);
  if (inFile !== Boolean(resource.safety_box_required_before_prompts)) {
    mismatched++;
    fail(
      `safety-box flag disagrees for ${resource.file}: manifest=${resource.safety_box_required_before_prompts}, file=${inFile}`
    );
  }
}
if (mismatched === 0) ok(`safety-box flags agree for all ${manifest.resources.length} worksheets`);

// And the box is really there, above the prompts. The page refuses to render
// an exercise whose box has gone missing, so this catches it at build instead
// of leaving a worksheet blank for a member.
const needBox = manifest.resources.filter((r) => r.safety_box_required_before_prompts);
for (const resource of needBox) {
  const body = readFileSync(join(ROOT, resource.file), "utf8").split("---").slice(2).join("---");
  const box = body.match(/^>\s+\S/m);
  const prompt = body.match(/^(Step\s*\d|\d+\.|\*\*Step)/m);
  if (!box || (prompt && box.index > prompt.index)) {
    fail(`${resource.file} needs a safety box above its prompts and has none`);
  }
}
ok(`${needBox.length} worksheets carry their safety box above the prompts`);

/* the two worksheets barred from group sharing are marked in both places */

// `group_sharing` is the field every worksheet carries, and the one the
// manifest mirrors; the explicit `not_for_group_sharing` key appears on only
// some of them. Checking the field they all have is what makes this an
// assertion about the content rather than about a spelling.
const barred = manifest.resources.filter((r) => r.not_for_group_sharing);
for (const resource of manifest.resources) {
  const raw = readFileSync(join(ROOT, resource.file), "utf8");
  const sharedInFile = !/^group_sharing:\s*false\s*$/m.test(raw);
  if (sharedInFile === Boolean(resource.not_for_group_sharing)) {
    fail(
      `group-sharing disagrees for ${resource.file}: manifest bars it = ${Boolean(
        resource.not_for_group_sharing
      )}, file allows it = ${sharedInFile}`
    );
  }
}
ok(`${barred.length} worksheets barred from group sharing, agreeing with their files`);

// A barred worksheet also says so in its own front matter, so the file is
// self-describing for anyone reading it outside the platform.
for (const resource of barred) {
  const raw = readFileSync(join(ROOT, resource.file), "utf8");
  for (const key of ["worksheet_private", "not_for_group_sharing"]) {
    if (!new RegExp(`^${key}:\\s*true\\s*$`, "m").test(raw)) {
      fail(`${resource.file} is barred from group sharing but has no ${key}: true`);
    }
  }
}
ok(`${barred.length} barred worksheets carry worksheet_private and not_for_group_sharing`);

console.log(
  failures === 0
    ? "\nWhen Your Mind Won't Rest: manifest and content agree.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
