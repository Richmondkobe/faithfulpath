// Holds the current course editions' lesson pages to docs/LESSON-TEMPLATE.md.
//
//   npm run verify:lessons   (tsx runs it, for the TypeScript in lib/)
//
// The template was written from When Your Mind Won't Rest, whose own check
// (verify:mind) enforces it section by section. The Spiritual Reset, Before You
// Say Yes and Talk Before You Marry editions are Richmond's reviewed HTML pages
// with their own section names, so this checks each lesson page, as the site
// serves it, against the template's rules that every one of them shares:
//
//  1. Watch or listen comes before the transcript, and the transcript is
//     collapsed until the learner opens it (template sections 3 and 4).
//  2. Completion is pressed, never inferred: no scroll tracking, no observer,
//     no handler on the end of the recording (section 10).
//  3. One completion button, and after it "Stop here for today", or on the
//     course's last lesson "Back to the course page" (section 10).
//  4. Where a page offers a route to support (help, a pastor), the learner
//     meets one before the completion block (section 9).
//  5. Where a page has boxes to write in, it says what happens to the writing
//     (section 8, "Say what is true about where the writing goes").
//
// Retreat sessions and guides are outside the template by its own scope note,
// and so are the Following Jesus pages; they are not checked here.
//
// Nothing here touches the database or storage: pages are built from the
// files, as if for a member who has completed nothing, and the npm script runs
// it with placeholder Supabase and Stripe settings, so it could reach neither if
// it tried.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as Tbym from "../lib/tbym-new.ts";
import * as Bysy from "../lib/bysy-new.ts";
import * as Reset from "../lib/reset-new.ts";

const EDITIONS = [
  { name: "Talk Before You Marry", folder: "talk-before-you-marry-new", units: Tbym.TBYM_NEW_UNITS, build: Tbym.unitHtml },
  { name: "Before You Say Yes", folder: "before-you-say-yes-new", units: Bysy.BYSY_NEW_UNITS, build: Bysy.unitHtml },
  { name: "The Christian Spiritual Reset", folder: "christian-spiritual-reset-new", units: Reset.RESET_NEW_UNITS, build: Reset.unitHtml },
];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};
const at = (html, re) => {
  const m = re.exec(html);
  return m ? m.index : -1;
};

for (const ed of EDITIONS) {
  const lessons = ed.units.filter((u) => (u.kind ?? "lesson") === "lesson");
  let checked = 0;
  for (const unit of lessons) {
    const raw = await readFile(join(process.cwd(), "content", "courses", ed.folder, unit.slug, "page.html"), "utf8");
    const html = ed.build(unit, raw, new Set());
    const where = `${ed.name}, ${unit.slug}`;

    // 1. Watch or listen, then the transcript, collapsed.
    const player = at(html, /<iframe\b/);
    const transcript = at(html, /<details[^>]*>(?:(?!<\/details>)[\s\S])*?class="tx"/);
    if (player < 0) fail(`${where}: no player`);
    if (transcript < 0) fail(`${where}: no transcript in a collapsible section`);
    if (player >= 0 && transcript >= 0 && player > transcript) fail(`${where}: the transcript comes before the player`);
    const details = /<details([^>]*)>(?:(?!<\/details>)[\s\S])*?class="tx"/.exec(html);
    if (details && /\bopen\b/.test(details[1])) fail(`${where}: the transcript is open by default`);

    // 2. Completion is pressed, never inferred.
    if (/IntersectionObserver|addEventListener\(\s*['"](?:scroll|ended)['"]|\bonended\b|\bonscroll\b/.test(html)) {
      fail(`${where}: something other than a button could mark the lesson complete (scroll, observer or end of recording)`);
    }

    // 3. One completion button; then rest is the default.
    const finishes = html.match(/I have completed this lesson|Mark this lesson complete/g) ?? [];
    if (finishes.length !== 1) fail(`${where}: ${finishes.length} completion buttons, expected one`);
    const isLast = unit === lessons[lessons.length - 1];
    if (!/Stop here for today|Back to the course page/.test(html)) {
      fail(`${where}: no "Stop here for today" (or "Back to the course page") after completion`);
    }
    if (isLast && /Continue to Lesson/.test(html.slice(at(html, /I have completed this lesson|Mark this lesson complete/)))) {
      fail(`${where}: the last lesson still offers to continue`);
    }

    // 4. Support before completion: where a page offers a route to support,
    //    the learner meets one before the completion block. A further safety
    //    reminder after it (Talk Before You Marry, Lesson 1) does no harm.
    const finishAt = at(html, /I have completed this lesson|Mark this lesson complete/);
    const firstSupport = at(html, /href="\/help"|href="\/talk-to-a-pastor"/);
    if (firstSupport >= 0 && finishAt >= 0 && firstSupport > finishAt) {
      fail(`${where}: the only routes to support come after the completion block`);
    }

    // 5. Writing: the page says what happens to it.
    if (/<textarea/.test(html) && !/\bsav(?:ed|e|ing)\b/i.test(html)) {
      fail(`${where}: has boxes to write in but does not say whether the writing is saved`);
    }
    checked++;
  }
  console.log(`${failures ? "…" : "✓"} ${ed.name}: ${checked} lesson pages checked`);
}

console.log(failures ? `\n${failures} problem(s).` : "\nEvery current lesson page follows the lesson template's shared rules.");
process.exit(failures ? 1 : 0);
