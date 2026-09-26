#!/usr/bin/env node
// Build assertions for "Talk Before You Marry".
//
// Two kinds of thing are checked here. The first is the lesson template: the
// eleven sections in their order, which docs/LESSON-TEMPLATE.md fixes and
// CLAUDE.md requires. The second is this course's own rules from the build
// brief — nothing a learner writes is stored, no editorial text reaches a page,
// and no bracketed placeholder is published as if it were content.
//
// None of these failures would break a page. Each one renders as something,
// which is exactly why they need catching here rather than by a reader.
//
// Run with: npm run verify:tbym

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "talk-before-you-marry");
const manifest = JSON.parse(readFileSync(join(ROOT, "course.json"), "utf8"));

let failures = 0;
const fail = (message) => {
  console.error(`  FAIL  ${message}`);
  failures++;
};
const ok = (message) => console.log(`  ok    ${message}`);

/* the manifest and the files agree */

if (manifest.lesson_count !== 14) {
  fail(`the course is fourteen lessons; the manifest says ${manifest.lesson_count}`);
}
if (manifest.saved_reflections !== false) {
  fail("saved_reflections must be false — this course stores nothing a learner writes");
}
if (manifest.footer_links.length !== 2) {
  fail(`lessons take the short footer of two support links; found ${manifest.footer_links.length}`);
}
ok(`manifest: ${manifest.lessons.length} of ${manifest.lesson_count} lessons built, reflections off`);

/* every lesson is built to the template */

// The headings are the contract between the files and the route. "If it helps,
// tell someone" is omitted by design on Lessons 3, 7 and 12, so it is checked
// separately from the ones that must always be there.
const REQUIRED = [
  "In this lesson, you will learn to:",
  "Take one step",
  "Let it settle",
  "Need more support?",
  "Transcript",
  "Worksheet",
];
const TELL_SOMEONE = "If it helps, tell someone";
const OMIT_TELL_SOMEONE = new Set([3, 7, 12]);

const STANDARD_SUPPORT =
  "If this conversation feels too heavy to carry alone, you may speak with a trusted pastor, mentor or qualified professional. If you are afraid of your partner's response or do not feel free to speak, pause the joint exercise and visit Safety and Support.";

// Safety works at three levels (design, Section 5). Level 2 is the standard
// block, which most lessons carry word for word. Level 3 replaces it with a
// fuller warning written for that lesson's subject — the privacy of a private
// inventory, financial control, consent, authority used to silence, past
// experiences, and abuse mistaken for a communication problem. Those six are
// not held to the standard wording, but they must still do the two things the
// standard block does: name the people a learner can turn to, and point at
// Safety and Support. A fuller warning that quietly dropped either would be
// weaker than the block it replaced, which is the failure worth catching.
const FULLER_WARNING = new Set([3, 6, 7, 11, 12, 14]);

let templated = 0;
for (const lesson of manifest.lessons) {
  const where = `Lesson ${lesson.order}`;
  const path = join(ROOT, lesson.file);
  if (!existsSync(path)) {
    fail(`${where}: ${lesson.file} is named in the manifest and is not on disk`);
    continue;
  }

  const raw = readFileSync(path, "utf8");
  const headings = [...raw.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)].map((m) => m[1].trim());
  const sections = new Map();
  const parts = raw.split(/^##[ \t]+(.+?)[ \t]*$/m);
  for (let i = 1; i < parts.length; i += 2) sections.set(parts[i].trim(), parts[i + 1].trim());

  let sound = true;
  for (const heading of REQUIRED) {
    if (!sections.get(heading)) {
      fail(`${where}: the "${heading}" section is missing or empty`);
      sound = false;
    }
  }

  // The order of the headings is the order of the page.
  const expected = REQUIRED.filter((h) => headings.includes(h));
  const actual = headings.filter((h) => REQUIRED.includes(h));
  if (expected.join("|") !== actual.join("|")) {
    fail(`${where}: the sections are out of the template's order`);
    sound = false;
  }

  // An H2 is how a section begins, so an H2 anywhere else silently ends the
  // section it was written inside. Lesson 6's worksheet has three of its own
  // headings; written as H2 they would have cut the worksheet off at the first
  // one, with no error and a page that simply stopped early. Sub-headings are
  // H3 for that reason, and this is what keeps them there.
  const stray = headings.filter((h) => !REQUIRED.includes(h) && h !== TELL_SOMEONE);
  if (stray.length) {
    fail(`${where}: "${stray[0]}" is an H2 the template does not know — a heading inside a section must be H3, or it ends that section`);
    sound = false;
  }

  const hasTell = sections.has(TELL_SOMEONE);
  if (OMIT_TELL_SOMEONE.has(lesson.order) && hasTell) {
    fail(`${where}: "${TELL_SOMEONE}" must be omitted — the design does not invite disclosure here`);
    sound = false;
  }
  if (!OMIT_TELL_SOMEONE.has(lesson.order) && !hasTell) {
    fail(`${where}: "${TELL_SOMEONE}" is missing, and this lesson is not one of the three that omit it`);
    sound = false;
  }

  const objectives = (sections.get(REQUIRED[0]) ?? "")
    .split(/\r?\n/)
    .filter((l) => /^[-*]\s+\S/.test(l));
  if (objectives.length < 3 || objectives.length > 4) {
    fail(`${where}: the template asks for three or four objectives; found ${objectives.length}`);
    sound = false;
  }

  const prompts = (sections.get("Let it settle") ?? "")
    .split(/\r?\n/)
    .filter((l) => /^[-*]\s+\S/.test(l));
  if (prompts.length !== 2) {
    fail(`${where}: "Let it settle" must hold exactly two prompts; found ${prompts.length}`);
    sound = false;
  }

  const support = sections.get("Need more support?") ?? "";
  if (FULLER_WARNING.has(lesson.order)) {
    if (!/trusted pastor, mentor or qualified professional/.test(support)) {
      fail(`${where}: the fuller warning does not name a pastor, mentor or qualified professional`);
      sound = false;
    }
    if (!/Safety and Support/.test(support)) {
      fail(`${where}: the fuller warning does not point to Safety and Support`);
      sound = false;
    }
  } else if (!support.includes(STANDARD_SUPPORT)) {
    fail(`${where}: "Need more support?" does not carry the standard support block word for word`);
    sound = false;
  }

  /* nothing editorial, and nothing bracketed, reaches the page */

  const brackets = [...raw.matchAll(/\[[^\]\n]{3,}\]/g)]
    // A Markdown link is [text](href), which is content, not a placeholder.
    .filter((m) => raw[m.index + m[0].length] !== "(")
    .map((m) => m[0]);
  if (brackets.length) {
    fail(`${where}: bracketed placeholder text would be published — ${brackets[0]}`);
    sound = false;
  }

  for (const phrase of [
    "Notes for the reviewer",
    "Author's note",
    "draft for review",
    "for review",
    "Movement 1",
    "Movement 2",
  ]) {
    if (new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(raw)) {
      fail(`${where}: editorial text is still in the lesson file — "${phrase}"`);
      sound = false;
    }
  }

  if (sound) templated++;
}
ok(`${templated} lessons built to the template, with no editorial text and no placeholders`);

/* the course stores nothing a learner writes */

// The rule is easiest to break by accident, months from now, by adding an input
// to a page because every other course here has one. This looks at the route
// itself rather than trusting the manifest flag.
const PAGES = join("app", "members", "courses", "talk-before-you-marry");
const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.tsx?$/.test(entry.name)) files.push(path);
  }
};
walk(PAGES);
walk(join("components", "tbym"));

let inputs = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const element of ["<textarea", "<input", "<form"]) {
    if (source.includes(element)) {
      fail(`${file}: ${element} — this course has no field a learner can write in`);
      inputs++;
    }
  }
  if (/save\w*Reflection|saveLessonQuestions|course_reflections/i.test(source)) {
    fail(`${file}: writes to the reflections store, which this course opted out of`);
    inputs++;
  }
}
if (inputs === 0) {
  ok(`${files.length} course files: no input, no form, nothing written to the reflections store`);
}

/* completion is pressed, and only for the learner who pressed it */

const finish = readFileSync(join("components", "tbym", "TbymFinishLesson.tsx"), "utf8");
if (/IntersectionObserver|addEventListener\(\s*["']scroll|onEnded/.test(finish)) {
  fail("the completion block infers completion from scrolling or playback — it must be pressed");
} else {
  ok("completion is written by the button and by nothing else");
}

const writers = files.filter((f) => /setLessonComplete/.test(readFileSync(f, "utf8")));
if (writers.length !== 1) {
  fail(`completion is written from ${writers.length} places; it should be the one button`);
} else {
  ok("one call site writes completion, through the shared course_progress action");
}

console.log(
  failures === 0
    ? "\nTalk Before You Marry: the lessons hold to the template and to the build brief.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
