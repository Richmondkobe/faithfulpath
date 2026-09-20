import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

/**
 * The simple, audio-first layer, to the build-notes addendum of 19 September
 * 2026.
 *
 * Two layers now sit on one course. This one is the main learner experience:
 * audio, one truth, one Scripture, one question, one step. The detailed pages
 * it replaces are kept and become "Read the book chapter", so nothing that was
 * written is lost and a learner who wants the long version can have it.
 *
 * The page list is declared here rather than scanned from the directory, as the
 * detailed layer's is, so that adding a file cannot quietly add a page to the
 * course — and so the order, the module names and the audio mapping are one
 * thing to read.
 */

const ROOT = join(process.cwd(), "content", "courses", "before-you-say-yes");
const SIMPLE = join(ROOT, "simple-lessons");

export type SimpleKind = "start" | "lesson" | "checkin" | "closing" | "engagement";

export type SimplePage = {
  n: number;
  slug: string;
  file: string;
  title: string;
  module: string;
  /** The recording for this page, without its extension. */
  audio: string;
  kind: SimpleKind;
  /** The detailed page this one replaces, for "Read the book chapter". */
  chapter?: string;
};

const M = {
  start: "Start Here",
  m1: "Start With Yourself",
  m2: "Learn What to Look For",
  m3: "Date With Your Eyes Open",
  m4: "Make a Wise Decision",
  m5: "Choose Your Next Step",
  closing: "Closing",
  m6: "Optional Engagement Section",
} as const;

export const SIMPLE_PAGES: SimplePage[] = [
  { n: 1, slug: "welcome", file: "start-01-welcome.md", title: "Welcome", module: M.start, audio: "01-start-welcome", kind: "start", chapter: "00-welcome.md" },
  { n: 2, slug: "how-to-use", file: "start-02-how-to-use-the-course.md", title: "How to Use the Course", module: M.start, audio: "02-start-how-to-use", kind: "start", chapter: "02-how-this-course-works.md" },
  { n: 3, slug: "where-to-begin", file: "start-03-choose-where-to-begin.md", title: "Choose Where to Begin", module: M.start, audio: "03-start-choose-where-to-begin", kind: "start", chapter: "03-choose-your-route.md" },
  { n: 4, slug: "safety-and-support", file: "start-04-safety-and-support.md", title: "Safety and Support", module: M.start, audio: "04-start-safety-and-support", kind: "start", chapter: "04-a-note-on-safety.md" },

  { n: 5, slug: "lesson-01", file: "lesson-01-simple.md", title: "Why Do I Want a Relationship?", module: M.m1, audio: "05-lesson-01", kind: "lesson", chapter: "lesson-01-why-do-you-want-a-relationship.md" },
  { n: 6, slug: "lesson-02", file: "lesson-02-simple.md", title: "Does Our Faith Point in the Same Direction?", module: M.m1, audio: "06-lesson-02", kind: "lesson", chapter: "lesson-02-equally-yoked.md" },
  { n: 7, slug: "lesson-03", file: "lesson-03-simple.md", title: "Know Yourself Before You Choose Someone", module: M.m1, audio: "07-lesson-03", kind: "lesson", chapter: "lesson-03-know-yourself.md" },
  { n: 8, slug: "checkin-01", file: "checkin-01-am-i-ready.md", title: "Am I Ready to Date Wisely?", module: M.m1, audio: "08-checkin-01", kind: "checkin", chapter: "pause-01-am-i-ready-to-date.md" },

  { n: 9, slug: "lesson-04", file: "lesson-04-simple.md", title: "Attraction Is Not the Same as Wisdom", module: M.m2, audio: "09-lesson-04", kind: "lesson", chapter: "lesson-04-attraction-is-not-discernment.md" },
  { n: 10, slug: "lesson-05", file: "lesson-05-simple.md", title: "Look at Character, Not Just Charm", module: M.m2, audio: "10-lesson-05", kind: "lesson", chapter: "lesson-05-character-before-charisma.md" },
  { n: 11, slug: "lesson-06", file: "lesson-06-simple.md", title: "Red Flags Christians Sometimes Excuse", module: M.m2, audio: "11-lesson-06", kind: "lesson", chapter: "lesson-06-red-flags-christians-spiritualise.md" },
  { n: 12, slug: "lesson-07", file: "lesson-07-simple.md", title: "Green Flags That Really Matter", module: M.m2, audio: "12-lesson-07", kind: "lesson", chapter: "lesson-07-quiet-green-flags.md" },
  { n: 13, slug: "checkin-02", file: "checkin-02-what-have-i-seen.md", title: "What Have I Actually Seen?", module: M.m2, audio: "13-checkin-02", kind: "checkin", chapter: "pause-02-what-have-i-observed.md" },

  { n: 14, slug: "lesson-08", file: "lesson-08-simple.md", title: "Set Boundaries Without Feeling Guilty", module: M.m3, audio: "14-lesson-08", kind: "lesson", chapter: "lesson-08-boundaries-without-shame.md" },
  { n: 15, slug: "lesson-09", file: "lesson-09-simple.md", title: "Talk Honestly About Physical Boundaries", module: M.m3, audio: "15-lesson-09", kind: "lesson", chapter: "lesson-09-sexual-boundaries.md" },
  { n: 16, slug: "lesson-10", file: "lesson-10-simple.md", title: "Notice Family Patterns", module: M.m3, audio: "16-lesson-10", kind: "lesson", chapter: "lesson-10-family-patterns.md" },
  { n: 17, slug: "lesson-11", file: "lesson-11-simple.md", title: "Talk About Money Early Enough", module: M.m3, audio: "17-lesson-11", kind: "lesson", chapter: "lesson-11-money.md" },
  { n: 18, slug: "lesson-12", file: "lesson-12-simple.md", title: "Understand Their Past Wisely", module: M.m3, audio: "18-lesson-12", kind: "lesson", chapter: "lesson-12-their-past.md" },
  { n: 19, slug: "checkin-03", file: "checkin-03-pattern-or-one-event.md", title: "Is This a Pattern or One Event?", module: M.m3, audio: "19-checkin-03", kind: "checkin", chapter: "pause-03-patterns-not-impressions.md" },

  { n: 20, slug: "lesson-13", file: "lesson-13-simple.md", title: "What If Someone Says, “God Told Me”?", module: M.m4, audio: "20-lesson-13", kind: "lesson", chapter: "lesson-13-god-told-me.md" },
  { n: 21, slug: "lesson-14", file: "lesson-14-simple.md", title: "Whose Advice Should You Trust?", module: M.m4, audio: "21-lesson-14", kind: "lesson", chapter: "lesson-14-who-has-a-voice.md" },
  { n: 22, slug: "lesson-15", file: "lesson-15-simple.md", title: "Can You Build a Life Together?", module: M.m4, audio: "22-lesson-15", kind: "lesson", chapter: "lesson-15-can-we-build-a-life.md" },
  { n: 23, slug: "lesson-16", file: "lesson-16-simple.md", title: "Can Two Good Christians Be Wrong for Each Other?", module: M.m4, audio: "23-lesson-16", kind: "lesson", chapter: "lesson-16-good-christians-wrong-for-each-other.md" },
  { n: 24, slug: "checkin-04", file: "checkin-04-what-does-the-evidence-show.md", title: "What Does the Evidence Show?", module: M.m4, audio: "24-checkin-04", kind: "checkin", chapter: "pause-04-what-does-the-evidence-require.md" },

  { n: 25, slug: "lesson-17", file: "lesson-17-simple.md", title: "When It Is Wise to Continue", module: M.m5, audio: "25-lesson-17", kind: "lesson", chapter: "lesson-17-when-to-continue.md" },
  { n: 26, slug: "lesson-18", file: "lesson-18-simple.md", title: "When It Is Wise to Slow Down", module: M.m5, audio: "26-lesson-18", kind: "lesson", chapter: "lesson-18-when-to-slow-down.md" },
  { n: 27, slug: "lesson-19", file: "lesson-19-simple.md", title: "When It Is Time to Walk Away", module: M.m5, audio: "27-lesson-19", kind: "lesson", chapter: "lesson-19-when-to-walk-away.md" },
  { n: 28, slug: "lesson-20", file: "lesson-20-simple.md", title: "When You Fear No One Else Will Come", module: M.m5, audio: "28-lesson-20", kind: "lesson", chapter: "lesson-20-afraid-no-one-else.md" },

  { n: 29, slug: "next-faithful-step", file: "my-next-faithful-step.md", title: "My Next Faithful Step", module: M.closing, audio: "29-my-next-faithful-step", kind: "closing", chapter: "my-next-faithful-step.md" },

  { n: 30, slug: "engagement-01", file: "engagement-01-are-we-ready.md", title: "Are We Ready to Discuss Engagement?", module: M.m6, audio: "30-engagement-01", kind: "engagement", chapter: "module-6-01-before-engagement.md" },
  { n: 31, slug: "engagement-02", file: "engagement-02-questions-before-engagement.md", title: "Questions to Answer Before Engagement", module: M.m6, audio: "31-engagement-02", kind: "engagement", chapter: "module-6-02-questions-before-engagement.md" },
  { n: 32, slug: "engagement-03", file: "engagement-03-what-comes-next.md", title: "What Comes Next?", module: M.m6, audio: "32-engagement-03", kind: "engagement", chapter: "module-6-03-what-comes-next.md" },
];

export const findSimplePage = cache(
  (slug: string): SimplePage | null => SIMPLE_PAGES.find((p) => p.slug === slug) ?? null
);

/**
 * A page's markdown, with its implementation note removed.
 *
 * The addendum requires every IMPLEMENTATION NOTE comment to be gone from the
 * published pages. Stripping at read means the notes stay in the source, where
 * they are the authority for the page, and can never reach a reader — including
 * through anything derived from the body.
 */
export const readSimplePage = cache((file: string): string | null => {
  const path = join(SIMPLE, file);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  return raw.replace(/<!--[\s\S]*?-->/g, "").trim() || null;
});

/** The `## Sections` of a page, in order, keyed by heading. */
export function sectionsOf(markdown: string): Map<string, string> {
  const out = new Map<string, string>();
  let heading: string | null = null;
  let body: string[] = [];

  const flush = () => {
    if (heading !== null) out.set(heading, body.join("\n").trim());
    body = [];
  };

  for (const line of markdown.split("\n")) {
    const h2 = /^##\s+(?!#)(.*)$/.exec(line);
    const h1 = /^#\s+(?!#)(.*)$/.exec(line);
    if (h2 || h1) {
      flush();
      heading = (h2 ?? h1)![1].trim();
      continue;
    }
    body.push(line);
  }
  flush();
  return out;
}

import type { Screen } from "@/lib/bysy-types";
export type { Screen };

const OPTION_LINE = /Answer each with\s+\*\*([^*]+)\*\*/i;
// "1 = Not true · 2 = A little true · 3 = Partly true …" — Lesson 1's shape.
const OPTION_SCALE = /\d+\s*=\s*([^·\n]+)/g;
/** A screen without numbered statements still asks for writing when it says so. */
const WRITING_CUE = /\bwrite\b|\bfinish\b|\bname\b|\blist\b|\bdescribe\b|\?\s*$/im;
const OPTION_BULLET = /^-\s+\*\*([^*]+)\*\*\s*(?:—|-|–)/;

/**
 * The workbook, split into its screens.
 *
 * A screen is `### Screen N — Title`. Other `###` blocks between screens are
 * instructions that belong to the screens after them — "How to answer Screens
 * 3–8" carries the four choices those six screens use, and the screens
 * themselves never repeat them.
 */
/**
 * The screen's prose with its numbered list removed, wrapped lines included.
 *
 * A numbered item may run over several lines, and the continuation is indented
 * rather than numbered; dropping only the numbered line would leave the tail of
 * each statement stranded in the prose.
 */
function splitAroundList(body: string): { before: string; after: string } {
  const before: string[] = [];
  const after: string[] = [];
  let seenList = false;
  let inItem = false;

  for (const line of body.split("\n")) {
    if (/^\d+\.\s+/.test(line)) {
      seenList = true;
      inItem = true;
      continue;
    }
    if (inItem && /^\s+\S/.test(line)) continue;
    if (inItem && line.trim() === "") {
      inItem = false;
      continue;
    }
    inItem = false;
    (seenList ? after : before).push(line);
  }

  const tidy = (lines: string[]) => lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { before: tidy(before), after: tidy(after) };
}

/**
 * The workbook, from its heading to the end of the page.
 *
 * It cannot be taken from sectionsOf(): most workbooks are grouped into
 * "## Part 1 — Who I am" and the like, and a section map that splits on `##`
 * ends the workbook at the first of them. Eighteen of the twenty lessons lost
 * every screen that way, silently — the page rendered, with no workbook.
 */
export function workbookOf(markdown: string): string | null {
  const lines = markdown.split("\n");

  let start = lines.findIndex((l) => /^#\s+(?!#)\s*Go deeper/i.test(l));
  if (start !== -1) {
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((l) => /^#\s+(?!#)/.test(l));
    return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim() || null;
  }

  // Questions Before Engagement has no "Go deeper" heading: the questions are
  // the page rather than an optional extra. Its screens begin under "How to
  // answer", which carries the choices they all use, so the workbook starts
  // there — at the last `##` heading before the first screen that is still an
  // instruction rather than a group of questions.
  const firstScreen = lines.findIndex((l) => /^###\s+Screen\s+\d+/.test(l));
  if (firstScreen === -1) return null;
  for (let i = firstScreen; i >= 0; i--) {
    const h2 = /^##\s+(?!#)(.*)$/.exec(lines[i]);
    if (!h2) continue;
    if (/how to answer/i.test(h2[1])) { start = i; break; }
    if (start === -1) start = i;
  }
  return start === -1 ? null : lines.slice(start).join("\n").trim() || null;
}

export function parseScreens(workbook: string): Screen[] {
  const screens: Screen[] = [];
  let pending: string[] = [];
  // "How to answer Screens 3–8" means those six and no others. Without the
  // range the four choices leaked onto Screens 9 to 12, which are a reading
  // guide, a question to choose, a list of mistakes and a journal — none of
  // them answerable with "Seen" or "Not talked about".
  let pendingRange: [number, number] | null = null;
  // "## Part 2 — My patterns" groups the screens under it. Kept so a learner
  // on Screen 7 can see which part of the workbook they are in.
  let group: string | null = null;
  // Screens whose options came from a block that named them ("How to answer
  // Screens 3–8"). Those are not guesses and must never be cleared.
  const ranged = new Set<number>();
  let instructionsShown = false;
  let current: Screen | null = null;

  const push = () => {
    if (current) {
      const body = current.body.trim();
      current.prompts = [...body.matchAll(/^\d+\.\s+(.*)$/gm)].map((m) => m[1].trim());
      // Each prompt becomes its own labelled answer box, so leaving the
      // numbered list in the prose printed every statement twice. What is
      // above the list stays above the boxes and what is below stays below —
      // a note written after the questions is about them.
      current.ticks = [...body.matchAll(/^\s*[*-]\s*☐\s*(.+)$/gm)].map((m) => m[1].trim());

      if (current.prompts.length > 0) {
        const { before, after } = splitAroundList(body);
        current.body = before;
        current.after = after;
        current.kind = "questions";
      } else if (current.ticks.length > 0) {
        current.body = body;
        current.after = "";
        current.kind = "tick";
      } else {
        current.body = body;
        current.after = "";
        // A screen with no numbered statements and no tick list either asks
        // the learner to write something or it does not. "This is not a
        // result. It is a way to read your own answers" is not a question, and
        // a box under it asks one that was never put.
        // Read the screen's own instruction, not its examples. Lesson 1's
        // Screen 7 is a reading guide whose bullets include "Write it down" as
        // advice about what to do later; taking that as a cue put a box on the
        // one screen its rules say is not a result.
        const instruction = body
          .split("\n")
          .filter((l) => !/^\s*[*->]/.test(l))
          .join("\n");
        current.kind = WRITING_CUE.test(instruction) ? "write" : "read";
      }
      screens.push(current);
    }
    current = null;
  };

  for (const line of workbook.split("\n")) {
    const h2 = /^##\s+(?!#)(.*)$/.exec(line);
    if (h2) {
      push();
      group = h2[1].trim();
      pending = [];
      pendingRange = null;
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h3) {
      const title = h3[1].trim();
      const screen = /^Screen\s+(\d+)\s*(?:—|-|–)?\s*(.*)$/.exec(title);
      if (screen) {
        push();
        const n = Number(screen[1]);
        const inRange =
          pendingRange === null || (n >= pendingRange[0] && n <= pendingRange[1]);
        const inherited = inRange ? pending.join("\n") : "";
        const scale = [...inherited.matchAll(OPTION_SCALE)].map((m) => m[1].trim());
        const options = [
          ...(OPTION_LINE.exec(inherited)?.[1] ?? "").split("/").map((o) => o.trim()),
          ...inherited
            .split("\n")
            .map((l) => OPTION_BULLET.exec(l.trim())?.[1]?.trim())
            .filter((o): o is string => Boolean(o)),
          ...scale,
        ].filter(Boolean);
        // Shown once, above the first screen the instructions apply to.
        const instructions = inRange && !instructionsShown ? pending.join("\n").trim() : "";
        if (instructions) instructionsShown = true;
        if (pendingRange !== null && inRange) ranged.add(n);
        current = {
          n,
          title: screen[2].trim(),
          group,
          body: "",
          after: "",
          instructions,
          prompts: [],
          options,
          kind: "read",
          ticks: [],
          example: /\bexample\b/i.test(inherited),
        };
        continue;
      }
      // An instruction block: it applies to the screens it names, or to those
      // that follow when it names none.
      push();
      pending = [];
      instructionsShown = false;
      const range = /Screens?\s+(\d+)\s*(?:–|—|-|to)\s*(\d+)/i.exec(title);
      pendingRange = range ? [Number(range[1]), Number(range[2])] : null;
      continue;
    }
    if (current) current.body += line + "\n";
    else pending.push(line);
  }
  push();

  // Options inherited from an unranged instruction block run until a screen
  // stops being a question screen. Lesson 1's "1 = Not true … 5 = Very true"
  // covers Screens 1 to 6; Screen 7 is a reading guide, and the scale has
  // nothing to do with it or with the journal on Screen 11.
  let carrying = true;
  for (const s of screens) {
    if (s.kind !== "questions") carrying = false;
    if (!carrying && !ranged.has(s.n)) s.options = [];
  }

  // A screen may also name its own options inline, and ask for its own example.
  for (const s of screens) {
    if (s.options.length === 0) {
      const own = OPTION_LINE.exec(s.body)?.[1];
      if (own) s.options = own.split("/").map((o) => o.trim()).filter(Boolean);
    }
    if (!s.example && /\bexample\b/i.test(s.body)) s.example = true;
    // No choices means the writing *is* the answer, so the box stays.
    if (s.options.length === 0) s.example = true;
  }
  return screens;
}

/**
 * A transcript with the recording directions taken out, to addendum §4.
 *
 * The script in the file is written for whoever records it, so it opens with a
 * note to the reader of the file — "About seven minutes. Read slowly and
 * naturally. On the course page, place this inside the closed Read the
 * transcript section" — and carries *[Pause for five seconds.]* wherever the
 * voice should stop. Both are instructions to a narrator. A learner reading
 * the transcript should see the words that were spoken and nothing else; the
 * first of those leaked onto all 32 pages before this existed.
 *
 * The length is kept, because the Listen control states it — it is read from
 * the same line before the line is removed.
 */
export function transcriptOf(section: string | null): string {
  if (!section) return "";
  return section
    // The production note at the top: "*(About seven minutes. …)*"
    .replace(/^\s*\*\(About[^)]*\)\*\s*$/gm, "")
    // Stage directions: "*[Pause for five seconds.]*"
    .replace(/\*\[[^\]]*\]\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** "about 7 minutes", as the page states it, for the Listen control. */
export function lengthOf(listen: string | null, transcript: string | null): string | null {
  const fromButton = /Listen\s*(?:—|-|–)\s*([^*\n]+)/.exec(listen ?? "")?.[1]?.trim();
  if (fromButton) return fromButton;
  const fromScript = /\*\(About\s+([a-z0-9]+\s+minutes?)/i.exec(transcript ?? "")?.[1];
  return fromScript ? `about ${fromScript}` : null;
}

/**
 * The simple page a reader came from, for a detailed page opened as a book
 * chapter.
 *
 * Validated against the page list rather than trusted: it arrives in the URL,
 * and it decides what a heading says and where a link goes.
 */
export function chapterReferrer(from: string | undefined): SimplePage | null {
  if (!from) return null;
  return SIMPLE_PAGES.find((p) => p.slug === from) ?? null;
}

/** "Lesson 2", from a simple page — what a book chapter is a chapter *for*. */
export function lessonLabel(page: SimplePage): string {
  const n = /^lesson-(\d+)$/.exec(page.slug)?.[1];
  return n ? `Lesson ${Number(n)}` : page.title;
}

/** Straight quotes, lowercase — for comparing headings that differ only in typography. */
export function normaliseHeading(heading: string): string {
  return heading
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()
    .toLowerCase();
}

/**
 * The page's sections above the workbook, in the page's own order.
 *
 * Rendering only the headings a template knows about drops everything it does
 * not — which is how "Before you continue", the safety notice §3 puts at the
 * top of Lessons 6, 9, 10, 13 and 19, rendered nowhere at all. The files
 * already follow §3's order, so the page's order is the right one; what the
 * template does is move the transcript under the Listen control and replace
 * two sections with real controls.
 */
export function pageSections(markdown: string): { heading: string; body: string }[] {
  const lines = markdown.split("\n");
  const workbookAt = lines.findIndex(
    (l) => /^#\s+(?!#)\s*Go deeper/i.test(l) || /^##\s+(?!#)\s*How to answer/i.test(l)
  );

  // The workbook is a span, not a tail. Questions Before Engagement puts its
  // "Need support?" and its Continue *after* the last screen, and cutting
  // everything from the workbook onwards lost both — the page ended on a
  // conversation guide with no way forward and no support section.
  let resume = lines.length;
  if (workbookAt !== -1) {
    const lastScreen = lines.reduce(
      (found, line, i) => (/^###\s+Screen\s+\d+/.test(line) ? i : found),
      -1
    );
    if (lastScreen !== -1) {
      const after = lines.findIndex(
        (l, i) => i > lastScreen && /^##\s+(?!#)(?!\s*Part\s)/.test(l)
      );
      resume = after === -1 ? lines.length : after;
    }
  }

  const above = (
    workbookAt === -1
      ? lines
      : [...lines.slice(0, workbookAt), ...lines.slice(resume)]
  ).join("\n");

  const out: { heading: string; body: string }[] = [];
  // Starts as "" rather than null so the preamble is a section in its own
  // right. §3's "Before you begin" notice sits above the first heading on
  // Lessons 6, 9, 10, 13 and 19, as does Lesson 20's crisis notice and Start
  // Here 4's — seven pages whose safety notice rendered nowhere while this
  // waited for a heading before it would keep anything.
  let heading: string | null = "";
  let body: string[] = [];
  const flush = () => {
    if (heading !== null) out.push({ heading, body: body.join("\n").trim() });
    body = [];
  };
  for (const line of above.split("\n")) {
    const h2 = /^##\s+(?!#)(.*)$/.exec(line);
    if (h2) {
      flush();
      heading = h2[1].trim();
      continue;
    }
    if (/^#\s+(?!#)/.test(line)) continue; // the page title
    body.push(line);
  }
  flush();
  return out.filter((s) => s.body || s.heading);
}

/** Headings the template replaces with a control rather than rendering. */
export const HANDLED_HEADINGS = new Set([
  "listen",
  "listen to the lesson",
  "audio script and transcript",
  "what would you like to do next?",
]);

/**
 * A `**[ … ]**` marker in the source, and what it becomes on the page.
 *
 * The files write their controls as bracketed labels — "[ Continue to Start
 * Here 2 — How to Use the Course ]", "[ Write my answer ]". Rendered as
 * markdown they are words that look like buttons and do nothing, which left
 * the twelve pages without a "What would you like to do next?" section with no
 * way forward at all.
 */
export type Marker =
  | { kind: "link"; label: string; href: string; strong: boolean }
  | { kind: "write"; label: string; hint?: string }
  | { kind: "acknowledge"; label: string; href: string }
  | { kind: "drop" };

/** Markers the lesson nav already renders, so the prose should not repeat them. */
const NAV_MARKERS = /^(stop here for today|open the workbook|read the book chapter|read the transcript)$/i;

export function markersIn(body: string): string[] {
  return [...body.matchAll(/\*\*\[\s*([^\]]+?)\s*\]\*\*/g)].map((m) => m[1].trim());
}

/** The prose with its markers taken out, so they can be rendered as controls. */
export function withoutMarkers(body: string): string {
  return body
    .replace(/\*\*\[\s*[^\]]+?\s*\]\*\*\s*(\*\(optional\)\*)?/g, "")
    .split("\n")
    .filter((l, i, all) => !(l.trim() === "" && all[i - 1]?.trim() === ""))
    .join("\n")
    .trim();
}

/**
 * Where a marker goes.
 *
 * "Continue to …" is resolved against the page list rather than the label: the
 * sequence is linear, and a label that has drifted from the order should not
 * quietly send a learner to the wrong page. The label is still shown, so a
 * mismatch is visible rather than silent.
 */
export function resolveMarker(
  label: string,
  page: SimplePage,
  base: { home: string; simple: (slug: string) => string; detailed: (slug: string) => string }
): Marker {
  const text = label.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();

  if (NAV_MARKERS.test(lower)) return { kind: "drop" };

  if (lower === "write my answer") {
    // §4 and both pages' own notes: Lessons 6 and 19 have no answer box.
    if (page.slug === "lesson-06" || page.slug === "lesson-19") return { kind: "drop" };
    return {
      kind: "write",
      label: text,
      hint: page.slug === "lesson-14" ? "Use initials only." : undefined,
    };
  }

  if (lower === "i understand — continue" || lower === "i understand - continue") {
    const at = SIMPLE_PAGES.findIndex((p) => p.slug === page.slug);
    const next = SIMPLE_PAGES[at + 1];
    return { kind: "acknowledge", label: text, href: next ? base.simple(next.slug) : base.home };
  }

  if (/return to the course home/i.test(lower)) {
    return { kind: "link", label: text, href: base.home, strong: /finish/i.test(lower) };
  }

  if (/^read: if you are not sure you belong to christ$/i.test(lower)) {
    return { kind: "link", label: text, href: base.detailed("01-belonging-to-christ"), strong: false };
  }

  if (/help me with my relationship right now/i.test(lower)) {
    return { kind: "link", label: text, href: base.detailed("06-help-me-right-now"), strong: false };
  }

  // Start Here 3's four routes.
  const startWith = /^start with lesson (\d+)$/i.exec(lower);
  if (startWith) {
    return { kind: "link", label: text, href: base.simple(`lesson-${startWith[1].padStart(2, "0")}`), strong: true };
  }
  if (/^go to safety and support/i.test(lower)) {
    return { kind: "link", label: text, href: base.simple("safety-and-support"), strong: true };
  }

  if (/^continue to/i.test(lower)) {
    const at = SIMPLE_PAGES.findIndex((p) => p.slug === page.slug);
    const next = SIMPLE_PAGES[at + 1];
    return { kind: "link", label: text, href: next ? base.simple(next.slug) : base.home, strong: true };
  }

  // Anything unrecognised keeps its words rather than vanishing.
  return { kind: "drop" };
}

/**
 * Text addressed to whoever builds the page, removed before a learner sees it.
 *
 * The workbook preambles open by telling the builder when to show the workbook
 * and how long each screen is — "Only shown when the learner taps 'Open the
 * workbook.' Each screen below is one short page." — and then continue into
 * the privacy paragraph, which the learner does need. One italic block, two
 * audiences. The transcripts had the same problem and are handled where they
 * are read.
 *
 * Lesson 1's "1 = Not true · 2 = A little true …" goes too. It describes a
 * numeric scale the page does not use: the choices are offered by name, and
 * showing a number key beside them only invites the arithmetic the whole
 * course refuses to do.
 */
const BUILDER_TEXT: RegExp[] = [
  /Only shown when the learner taps\s*[“"']?Open the workbook\.?[”"']?\s*/gi,
  /Each screen below is one short page\.\s*/gi,
  /On the course page,\s*place this inside the closed\s*[“"']?Read the transcript[”"']?\s*section\.\s*/gi,
  /^\s*\d+\s*=\s*[^\n]*(?:·[^\n]*)+$/gm,
];

export function withoutBuilderText(markdown: string): string {
  let out = markdown;
  for (const pattern of BUILDER_TEXT) out = out.replace(pattern, "");
  return out
    // An italic block that held only builder text leaves empty emphasis behind.
    .replace(/\*\s*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
