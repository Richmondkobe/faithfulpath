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
// One, not the two rule 6 asked for: both ended up naming Safety and Support,
// and a reader met the same destination twice under two labels.
if (manifest.footer_links.length !== 1) {
  fail(`lessons take the short footer of one support link; found ${manifest.footer_links.length}`);
}
// Every footer destination is real. A null here renders as a placeholder, which
// was right while the pages did not exist and is now just a dead end.
for (const link of [...manifest.footer_links, ...manifest.full_footer_links]) {
  if (!link.href) fail(`footer link "${link.label}" has no destination`);
}
// And the last lesson has somewhere to point after the course's closing word.
if (!manifest.next_resource?.href || !manifest.next_resource?.label) {
  fail("next_resource needs a label and a destination for the last lesson's forward link");
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

// A word before the recording, on the lessons whose subject makes where and how
// you listen worth a sentence. The design names 3, 7 and 12; Lesson 14 was
// written with one too, and it belongs — a learner who is afraid of
// disagreement should be told they may read instead before the talk about
// conflict begins. The note is no use below the player, so the route puts it
// above; this only checks that the lesson supplies one.
const NEEDS_LISTENING_NOTE = new Set([3, 7, 12, 14]);

// Curly apostrophe, matching the content. It was straight until the content was
// converted, and this quietly began reporting six lessons as having reworded a
// block they had not touched.
const STANDARD_SUPPORT =
  "If this conversation feels too heavy to carry alone, you may speak with a trusted pastor, mentor or qualified professional. If you are afraid of your partner’s response or do not feel free to speak, pause the joint exercise and visit Safety and Support.";

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

// Which people a fuller warning sends somebody to is the lesson's own decision,
// and it should be: Lesson 6 sends them for independent financial advice,
// Lesson 7 for confidential support and a healthcare professional rather than
// to a pastor first. What may not happen is a warning that names a danger and
// then names nobody at all, so this asks only that at least one real route out
// is offered.
const SUPPORT_ROUTES = [
  /trusted pastor, mentor or qualified professional/,
  /qualified (healthcare |mental-health )?professional/,
  /confidential support/,
  /independent advice/,
  /qualified counsellor/,
];

let templated = 0;
const reworded = [];
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

  const hasNote = /^listening_note:\s*"[^"]{40,}"\s*$/m.test(raw);
  if (NEEDS_LISTENING_NOTE.has(lesson.order) && !hasNote) {
    fail(`${where}: no listening_note — this lesson's subject needs a word before the recording starts`);
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
    if (!SUPPORT_ROUTES.some((route) => route.test(support))) {
      fail(`${where}: the fuller warning names a danger but nobody to turn to`);
      sound = false;
    }
    if (!/Safety and Support/.test(support)) {
      fail(`${where}: the fuller warning does not point to Safety and Support`);
      sound = false;
    }
  } else {
    // A level-2 lesson keeps the standard block's three working parts: who to
    // turn to, the instruction to stop, and where to go. Its second trigger may
    // be its own — Lesson 10 names faith used to pressure or silence someone,
    // in place of the general "do not feel free to speak" — because what makes
    // a learner stop differs by subject. What may not change is that the block
    // still names help, still says pause, and still points at Safety and
    // Support. Requiring the whole block word for word would have forced a
    // lesson to choose between the design's wording and its own subject.
    for (const [part, present] of [
      // The same route-out test the fuller warnings use. Lesson 13 sends a
      // learner to a qualified counsellor rather than a qualified
      // professional, and says "may also speak" because its own legal and
      // child-welfare routing comes first; neither is a weaker offer, and
      // demanding the design's opening sentence verbatim would fail a block
      // that does everything the sentence exists to do.
      ["anyone to turn to", SUPPORT_ROUTES.some((route) => route.test(support))],
      ["the instruction to pause the joint exercise", /pause the joint exercise/.test(support)],
      ["the pointer to Safety and Support", /Safety and Support/.test(support)],
    ]) {
      if (!present) {
        fail(`${where}: "Need more support?" is missing ${part}`);
        sound = false;
      }
    }
    if (!support.includes(STANDARD_SUPPORT)) {
      // Not a failure, but worth seeing: the design writes one block for every
      // level-2 lesson, and a lesson that rewords it has made a decision.
      reworded.push(lesson.order);
    }
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

/* a shared chapter number is named, not repeated */

// The book's Chapter 6 holds all nine rooms, so nine Go deeper cards would
// otherwise read "Chapter 6" and look like nine links to nine different things.
// A lesson that shares its chapter number with another must carry a
// chapter_label; one with a chapter to itself needs none.
const byChapter = new Map();
for (const lesson of manifest.lessons) {
  const raw = readFileSync(join(ROOT, lesson.file), "utf8");
  const num = raw.match(/^chapter:\s*(\d+)\s*$/m)?.[1];
  if (!num) continue;
  byChapter.set(num, [...(byChapter.get(num) ?? []), { lesson, raw }]);
}

let labelled = 0;
for (const [num, group] of byChapter) {
  if (group.length === 1) continue;
  const labels = new Set();
  for (const { lesson, raw } of group) {
    const label = raw.match(/^chapter_label:\s*"([^"]+)"\s*$/m)?.[1];
    if (!label) {
      fail(`Lesson ${lesson.order}: shares chapter ${num} with ${group.length - 1} other lesson(s) and has no chapter_label`);
    } else {
      labels.add(label);
    }
  }
  if (labels.size > 1) {
    fail(`chapter ${num} is named ${labels.size} different ways across its lessons`);
  } else if (labels.size === 1) {
    labelled += group.length;
  }
}
if (labelled) {
  ok(`${labelled} lessons share a chapter and name it the same way`);
}

/* a slide lecture, where a lesson has one */

// A deck is only as good as its timings. Every slide needs a start time, they
// must run forward, and a lesson that declares a pause must have exactly one —
// the player stops at the end of that slide and waits, and two would strand a
// learner twice.
for (const lesson of manifest.lessons) {
  const folder = `lesson-${String(lesson.order).padStart(2, "0")}`;
  const deckPath = join(ROOT, folder, "slides.json");
  if (!existsSync(deckPath)) continue;

  const deck = JSON.parse(readFileSync(deckPath, "utf8"));
  const where = `Lesson ${lesson.order}`;
  let sound = true;

  if (deck.slides.length !== deck.timings.length) {
    fail(`${where}: ${deck.slides.length} slides but ${deck.timings.length} timings`);
    sound = false;
  }
  for (let i = 1; i < deck.timings.length; i++) {
    if (deck.timings[i] <= deck.timings[i - 1]) {
      fail(`${where}: slide ${i + 1} starts at or before the slide before it`);
      sound = false;
      break;
    }
  }
  const pauses = deck.slides.filter((s) => s.autoPause).length;
  if (pauses > 1) {
    fail(`${where}: ${pauses} slides ask the recording to pause; the player expects at most one`);
    sound = false;
  }
  const raw = readFileSync(join(ROOT, lesson.file), "utf8");
  // "null" is non-whitespace, so testing for any value passed a lesson whose
  // audio was null. It has to be a real id.
  if (!/^audio:\s*(?!null\s*$)\S+\s*$/m.test(raw)) {
    fail(`${where}: has slides but no audio in its front matter`);
    sound = false;
  }
  if (sound) {
    ok(`${where}: ${deck.slides.length} slides, timings in order, ${pauses} pause, recording named`);
  }
}

/* the last lesson closes the course */

// There is nowhere to continue to from Lesson 14, so the closing word is what
// stands where Continue stands on every other lesson. Without it the course
// ends on a finished panel with one button and nothing said.
if (manifest.lessons.length === manifest.lesson_count) {
  const last = manifest.lessons.reduce((a, b) => (b.order > a.order ? b : a));
  const raw = readFileSync(join(ROOT, last.file), "utf8");
  if (!/^completion_message:\s*"[^"]{40,}"\s*$/m.test(raw)) {
    fail(`Lesson ${last.order} is the last lesson and has no completion_message`);
  } else {
    ok(`Lesson ${last.order} closes the course with a completion message`);
  }
}

// A quote inside a front-matter value has to be curly, not backslash-escaped:
// the parser strips the wrapping quotes and a \" would reach the page with its
// backslash still attached. Lesson 14's listening note did exactly that.
let escaped = 0;
for (const lesson of manifest.lessons) {
  const front = readFileSync(join(ROOT, lesson.file), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (front && /\\"/.test(front[1])) {
    fail(`Lesson ${lesson.order}: a backslash-escaped quote in front matter would render as \\" — use curly quotes`);
    escaped++;
  }
}
if (escaped === 0) ok("no backslash-escaped quotes in any lesson's front matter");
if (reworded.length) {
  ok(`standard support block reworded in ${reworded.length} lesson(s): ${reworded.join(", ")} — each still names help, says pause and points at Safety and Support`);
}

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

// The rule is that nothing a learner writes is stored, so what this looks for
// is somewhere to write and anywhere it could go. A checkbox is neither: Start
// Here's safety acknowledgement is one, it holds no words, and it is never
// persisted — it reveals the buttons and is forgotten when the page is. Every
// other input, a textarea and a form are still refused outright, and so is any
// store a value could be quietly put into.
let inputs = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const element of ["<textarea", "<form"]) {
    if (source.includes(element)) {
      fail(`${file}: ${element} — this course has no field a learner can write in`);
      inputs++;
    }
  }
  for (const tag of source.match(/<input[^>]*>/g) ?? []) {
    if (!/type=["{]?["']?checkbox/.test(tag)) {
      fail(`${file}: an input that is not a checkbox — this course has no field a learner can write in`);
      inputs++;
    }
  }
  if (/save\w*Reflection|saveLessonQuestions|course_reflections/i.test(source)) {
    fail(`${file}: writes to the reflections store, which this course opted out of`);
    inputs++;
  }
  if (/localStorage|sessionStorage|document\.cookie/.test(source)) {
    fail(`${file}: keeps something in the browser — nothing a learner does here is remembered`);
    inputs++;
  }
}
if (inputs === 0) {
  ok(`${files.length} course files: no writable field, no form, nothing stored in a browser or a reflections table`);
}

/* completion is pressed, and only for the learner who pressed it */

const finish = readFileSync(join("components", "tbym", "TbymFinishLesson.tsx"), "utf8");
if (/IntersectionObserver|addEventListener\(\s*["']scroll|onEnded/.test(finish)) {
  fail("the completion block infers completion from scrolling or playback — it must be pressed");
} else {
  ok("completion is written by the button and by nothing else");
}

/* Safety and Support holds to what is left of rule 7 */

// The country chooser and its directory are gone, at the author's direction:
// the page now points to any qualified professional locally, and to the
// author's own email for a live session. So the checks that guarded a
// directory have gone with it.
//
// What still holds, and is still worth enforcing: the page must not work out
// where the visitor is, and the quick exit must take this page out of the back
// history rather than leave it one press behind.
const SAFETY_PAGE = join(PAGES, "safety-and-support", "page.tsx");
const SAFETY_PARTS = [SAFETY_PAGE, join("components", "tbym", "TbymQuickExit.tsx")];

let safety = 0;
for (const file of SAFETY_PARTS) {
  if (!existsSync(file)) {
    fail(`${file}: Safety and Support is missing a part it needs`);
    safety++;
    continue;
  }
  const source = readFileSync(file, "utf8");
  for (const sniff of [/navigator\.language/, /Intl\.DateTimeFormat\(\)\.resolvedOptions/, /geolocation/, /ipapi|ipinfo|geoip/i]) {
    if (sniff.test(source)) {
      fail(`${file}: works out where the visitor is — this page never needs to`);
      safety++;
    }
  }
}

const quickExit = readFileSync(join("components", "tbym", "TbymQuickExit.tsx"), "utf8");
// The call, not the sentence about it: the doc comment names location.replace
// too, and matched a file whose call had been changed to assign.
if (!/window\.location\.replace\s*\(/.test(quickExit)) {
  fail("the quick exit does not use location.replace, so this page stays one press behind in history");
  safety++;
}

// The two things the page must still say: where to go in an emergency, and
// where to find help near you.
const safetyContent = readFileSync(join(ROOT, "safety-and-support.md"), "utf8");
for (const [what, present] of [
  ["the emergency-service section", /^## If you are in immediate danger$/m.test(safetyContent)],
  ["the section pointing to local help", /^## Get help near you$/m.test(safetyContent)],
  ["a way to reach the author", /info@faithfulpathcommunity\.com/.test(safetyContent)],
  // The contact route must never read as a route to help in a crisis. The
  // draft's own directory note asked for this in as many words.
  ["the line saying that contact is not an emergency service", /not an emergency service/.test(safetyContent)],
]) {
  if (!present) {
    fail(`Safety and Support is missing ${what}`);
    safety++;
  }
}

if (safety === 0) {
  ok("Safety and Support: nothing detects location, the quick exit replaces history, emergency and local help both named");
}

/* every page renders a footer, and the right one */

// The footer used to live in the layout, which made it impossible to forget and
// impossible to vary. This course needs both variants — the short one on
// lessons, the fuller one on the pages a learner arrives at — so each page
// renders its own, and this is what replaces the layout's guarantee.
const FOOTER_VARIANT = {
  "page.tsx": "full",
  "start-here/page.tsx": "full",
  "safety-and-support/page.tsx": "full",
  "facilitator-guide/page.tsx": "full",
  "privacy/page.tsx": "full",
  "terms/page.tsx": "full",
  "lessons/[slug]/page.tsx": "short",
  "lessons/[slug]/worksheet/page.tsx": "short",
};

// A page that appears in the fuller footer must drop its own link, or its
// footer offers the reader the page they are already on.
const FOOTER_OMITS = {
  "safety-and-support/page.tsx": "tbymSafetyHref",
  "privacy/page.tsx": "tbymPrivacyHref",
  "terms/page.tsx": "tbymTermsHref",
};

let footers = 0;
for (const [rel, variant] of Object.entries(FOOTER_VARIANT)) {
  const path = join(PAGES, ...rel.split("/"));
  if (!existsSync(path)) {
    fail(`${rel}: named as a page of this course and not on disk`);
    continue;
  }
  const source = readFileSync(path, "utf8");
  if (!new RegExp(`<TbymFooter\\s+variant="${variant}"`).test(source)) {
    fail(`${rel}: does not render the ${variant} footer`);
  } else if (FOOTER_OMITS[rel] && !source.includes(`omit={${FOOTER_OMITS[rel]}}`)) {
    fail(`${rel}: appears in the fuller footer and does not omit its own link`);
  } else {
    footers++;
  }
}
// A page added later without a footer would not be listed above, so this also
// checks that no page file has been added that the list does not know about.
const pageFiles = files.filter((f) => /[\\/]page\.tsx$/.test(f)).length;
if (pageFiles !== Object.keys(FOOTER_VARIANT).length) {
  fail(`${pageFiles} page files, but the footer list knows ${Object.keys(FOOTER_VARIANT).length} — a new page needs a footer and a line here`);
} else if (footers === pageFiles) {
  ok(`${footers} pages, each rendering the footer the build brief gives it`);
}

// Every page of the course sits behind the publish gate as well as the
// membership check. The flag alone once hid only the card on the members page,
// which meant an unpublished course was merely unlinked and any member holding
// a URL still walked in. A page that forgets this line reopens that hole
// silently, so it is checked rather than trusted.
let gated = 0;
for (const rel of Object.keys(FOOTER_VARIANT)) {
  const path = join(PAGES, ...rel.split("/"));
  if (!existsSync(path)) continue;
  const source = readFileSync(path, "utf8");
  if (/requireTbymPublished\s*\(\s*\)/.test(source)) gated++;
  else fail(`${rel}: does not call requireTbymPublished(), so it is reachable while the course is off`);
}
if (gated === Object.keys(FOOTER_VARIANT).length) {
  ok(`${gated} pages, each behind the publish gate as well as the membership check`);
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
