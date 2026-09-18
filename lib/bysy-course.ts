import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { BYSY_SLUG, bysyPageHref } from "@/lib/bysy-links";
import {
  REVIEW_IN_PROGRESS,
  renderSharedSections,
  sharedReviewDate,
} from "@/lib/bysy-resources";

// Reader for "Before You Say Yes".
//
// This course has no course.json. Its structure is the file list
// (before-you-say-yes-course-file-list.md) and its labels are the navigation
// file (course-navigation.md), both of which are prose for a person to read.
// So the structure is declared here, in code, against those two documents —
// and scripts/verify-bysy-course.mjs holds this declaration to the file list
// so the two cannot drift apart.
//
// Every constraint referenced below is from before-you-say-yes-course-build-notes.md.

export { BYSY_SLUG } from "@/lib/bysy-links";

const ROOT = join(process.cwd(), "content", "courses", BYSY_SLUG);

export type PageKind = "start" | "routing" | "lesson" | "pause" | "conclusion" | "engagement";

export type BysyPage = {
  /** Position in the 35, 1-based. The course home is not one of them. */
  n: number;
  file: string;
  /** The navigation label from course-navigation.md. */
  label: string;
  kind: PageKind;
  module: string;
  /** Lesson number, for the twenty teaching lessons. */
  lesson?: number;
};

/** Module titles, from course-navigation.md. */
const M0 = "Start Here";
const M_ROUTING = "Help Me With My Relationship Right Now";
const M1 = "Before You Start Dating";
const M2 = "Choosing Wisely";
const M3 = "Dating With Your Eyes Open";
const M4 = "Discernment";
const M5 = "Continue, Slow Down or Walk Away";
const M6 = "Before You Say Yes to Engagement";

/**
 * The 35 content pages, in the order of the file list. The course home is
 * deliberately absent: the build notes are explicit that it is not page 1 of 36.
 */
const PAGES: Omit<BysyPage, "n">[] = [
  { file: "00-welcome.md", label: "Welcome", kind: "start", module: M0 },
  { file: "01-belonging-to-christ.md", label: "If You Are Not Sure You Belong to Christ", kind: "start", module: M0 },
  { file: "02-how-this-course-works.md", label: "How This Course Works", kind: "start", module: M0 },
  { file: "03-choose-your-route.md", label: "Choose Your Route", kind: "start", module: M0 },
  { file: "04-a-note-on-safety.md", label: "A Note on Safety", kind: "start", module: M0 },
  { file: "05-finding-help.md", label: "Finding Help Where You Live", kind: "start", module: M0 },

  { file: "06-help-me-right-now.md", label: M_ROUTING, kind: "routing", module: M_ROUTING },

  { file: "lesson-01-why-do-you-want-a-relationship.md", label: "Why Do You Want a Relationship?", kind: "lesson", module: M1, lesson: 1 },
  { file: "lesson-02-equally-yoked.md", label: 'What Does "Equally Yoked" Actually Mean?', kind: "lesson", module: M1, lesson: 2 },
  { file: "lesson-03-know-yourself.md", label: "Know Yourself Before You Choose", kind: "lesson", module: M1, lesson: 3 },
  { file: "pause-01-am-i-ready-to-date.md", label: "Am I Ready to Date?", kind: "pause", module: M1 },

  { file: "lesson-04-attraction-is-not-discernment.md", label: "Attraction Is Not Discernment", kind: "lesson", module: M2, lesson: 4 },
  { file: "lesson-05-character-before-charisma.md", label: "Character Before Charisma", kind: "lesson", module: M2, lesson: 5 },
  { file: "lesson-06-red-flags-christians-spiritualise.md", label: "Red Flags Christians Spiritualise", kind: "lesson", module: M2, lesson: 6 },
  { file: "lesson-07-quiet-green-flags.md", label: "The Quiet Green Flags That Matter", kind: "lesson", module: M2, lesson: 7 },
  { file: "pause-02-what-have-i-observed.md", label: "What Have I Actually Observed?", kind: "pause", module: M2 },

  { file: "lesson-08-boundaries-without-shame.md", label: "Boundaries Without Shame", kind: "lesson", module: M3, lesson: 8 },
  { file: "lesson-09-sexual-boundaries.md", label: "Sexual Boundaries, Practically", kind: "lesson", module: M3, lesson: 9 },
  { file: "lesson-10-family-patterns.md", label: "Family Patterns, Loyalties and Boundaries", kind: "lesson", module: M3, lesson: 10 },
  { file: "lesson-11-money.md", label: "Money Reveals More Than a Salary", kind: "lesson", module: M3, lesson: 11 },
  { file: "lesson-12-their-past.md", label: "Their Past Matters, But Not the Way You Think", kind: "lesson", module: M3, lesson: 12 },
  { file: "pause-03-patterns-not-impressions.md", label: "Patterns, Not Isolated Impressions", kind: "pause", module: M3 },

  { file: "lesson-13-god-told-me.md", label: '"God Told Me" and Other Hard Questions', kind: "lesson", module: M4, lesson: 13 },
  { file: "lesson-14-who-has-a-voice.md", label: "Who Should Have a Voice in Your Relationship?", kind: "lesson", module: M4, lesson: 14 },
  { file: "lesson-15-can-we-build-a-life.md", label: "Can We Build a Life Together?", kind: "lesson", module: M4, lesson: 15 },
  { file: "lesson-16-good-christians-wrong-for-each-other.md", label: "When Good Christians Are Wrong for Each Other", kind: "lesson", module: M4, lesson: 16 },
  { file: "pause-04-what-does-the-evidence-require.md", label: "What Does the Evidence Require?", kind: "pause", module: M4 },

  { file: "lesson-17-when-to-continue.md", label: "When to Continue With Wisdom", kind: "lesson", module: M5, lesson: 17 },
  { file: "lesson-18-when-to-slow-down.md", label: "When to Slow Down", kind: "lesson", module: M5, lesson: 18 },
  { file: "lesson-19-when-to-walk-away.md", label: "When to Walk Away", kind: "lesson", module: M5, lesson: 19 },
  { file: "lesson-20-afraid-no-one-else.md", label: "When You Are Afraid You Will Never Find Anyone Else", kind: "lesson", module: M5, lesson: 20 },
  { file: "my-next-faithful-step.md", label: "My Next Faithful Step", kind: "conclusion", module: M5 },

  { file: "module-6-01-before-engagement.md", label: "Before You Say Yes to Engagement", kind: "engagement", module: M6 },
  { file: "module-6-02-questions-before-engagement.md", label: "Questions Before Engagement", kind: "engagement", module: M6 },
  { file: "module-6-03-what-comes-next.md", label: "What Comes Next?", kind: "engagement", module: M6 },
];

export const getPages = cache((): BysyPage[] =>
  PAGES.map((p, i) => ({ ...p, n: i + 1 }))
);

/** A page's URL segment: its filename without the extension. */
export function pageSlug(page: { file: string }): string {
  return page.file.replace(/\.md$/, "");
}

export const findPage = cache((slug: string): BysyPage | null =>
  getPages().find((p) => pageSlug(p) === slug) ?? null
);

export const findLesson = cache((n: number): BysyPage | null =>
  getPages().find((p) => p.lesson === n) ?? null
);

/* ------------------------------------------------------------------ routes */

/**
 * Routes are stored as opaque identifiers, never as their descriptive label.
 *
 * The build notes are explicit: a route choice is a navigation preference, not
 * a relationship finding, and the label must not reach analytics, account
 * history, notifications or admin screens. Storing "r3" rather than "I am
 * deciding whether to continue" is what makes that true of the stored value
 * itself, rather than depending on every future screen to remember.
 */
export type RouteId = "r1" | "r2" | "r3" | "r4" | "rc";

export type Route = {
  id: RouteId;
  /** Shown to the learner. Never stored, never sent anywhere. */
  label: string;
  /** The pages this route passes through, in order, by file. */
  files: string[];
};

const startHere = PAGES.filter((p) => p.module === M0).map((p) => p.file);
const lessonFiles = (from: number, to: number) =>
  PAGES.filter((p) => p.lesson && p.lesson >= from && p.lesson <= to).map((p) => p.file);
const pauseFile = (n: 1 | 2 | 3 | 4) =>
  PAGES.filter((p) => p.kind === "pause")[n - 1].file;

const ROUTES: Route[] = [
  {
    id: "r1",
    label: "I am not dating yet",
    files: [...startHere, ...lessonFiles(1, 3), pauseFile(1), ...lessonFiles(4, 7), pauseFile(2)],
  },
  {
    id: "r2",
    label: "I have recently started dating",
    files: [
      ...startHere, ...lessonFiles(1, 3), pauseFile(1), ...lessonFiles(4, 7), pauseFile(2),
      ...lessonFiles(8, 12), pauseFile(3), ...lessonFiles(13, 16), pauseFile(4),
    ],
  },
  {
    id: "r3",
    label: "I am deciding whether to continue",
    files: [
      "04-a-note-on-safety.md",
      ...lessonFiles(6, 6), ...lessonFiles(12, 16), pauseFile(4),
      ...lessonFiles(17, 20), "my-next-faithful-step.md",
    ],
  },
  {
    id: "r4",
    label: "We are considering engagement",
    files: [
      "04-a-note-on-safety.md",
      ...lessonFiles(13, 16), pauseFile(4), ...lessonFiles(17, 20), "my-next-faithful-step.md",
      ...PAGES.filter((p) => p.module === M6).map((p) => p.file),
    ],
  },
  { id: "rc", label: "The complete course", files: PAGES.map((p) => p.file) },
];

export const getRoutes = cache((): Route[] => ROUTES);

export function findRoute(id: string | null | undefined): Route | null {
  return ROUTES.find((r) => r.id === id) ?? null;
}

export function isRouteId(value: string): value is RouteId {
  return ROUTES.some((r) => r.id === value);
}

/**
 * Where a page sits on a route, or null when the route does not include it.
 *
 * Null is an ordinary answer, not an error: no page is locked by a route, so a
 * learner may be reading something their route does not pass through. The page
 * then shows its position in the whole course instead.
 */
export function positionOnRoute(route: Route, file: string): { at: number; of: number } | null {
  const at = route.files.indexOf(file);
  return at === -1 ? null : { at: at + 1, of: route.files.length };
}

/* ------------------------------------------------------------------- body */

const IMPLEMENTATION_COMMENT = /<!--[\s\S]*?-->/g;

/**
 * A page's Markdown, with the implementation comments removed.
 *
 * Each page carries a note to whoever builds the course, ending "Remove this
 * note before publishing". react-markdown would drop an HTML comment anyway,
 * but stripping it here means it is gone from the body everywhere — including
 * anything derived from it later, and including the copy that would otherwise
 * sit in the page source for a reader to view.
 */
export const readPage = cache((file: string): string | null => {
  const path = join(ROOT, file);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8").replace(IMPLEMENTATION_COMMENT, "").trim();
});

/** The course home copy, comments stripped, same as any page. */
export const readCourseHome = cache((): string | null => readPage("course-home.md"));

/* ------------------------------------------------------------------- links */

/**
 * Turns the course's own cross-references into links.
 *
 * The content names its destinations in prose — "Finding Help Where You Live",
 * "Lesson 6", "What Does the Evidence Require?" — and carries no Markdown
 * links at all. Ninety-four of those references are to the support page, which
 * is the one a learner in difficulty is being sent to, so leaving them as words
 * is not an option.
 *
 * Every rule here comes from the brief: support references go to the course's
 * own support page and never to the public resources page; a lesson range goes
 * to the first lesson in the range; a pause is linked by its own title.
 */
export function linkReferences(body: string, selfFile?: string): string {
  const support = "05-finding-help.md";
  const pauses = getPages().filter((p) => p.kind === "pause");

  return body
    .split(/\r?\n/)
    .map((line) => {
      // Headings and code stay as they are; a linked heading reads as a fault.
      if (/^\s{0,3}#/.test(line) || /^\s*```/.test(line) || /^\s{4,}\S/.test(line)) return line;

      let out = line;

      const link = (text: string, file: string) => {
        if (file === selfFile) return;
        const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Skip anything already inside a Markdown link.
        out = out.replace(
          new RegExp(`(?<!\\[)${escaped}(?!\\])(?![^[]*\\]\\()`, "g"),
          `[${text}](${bysyPageHref(file.replace(/\.md$/, ""))})`
        );
      };

      // The support page, under both spellings the content uses.
      link("Finding Help Where You Live", support);
      link("Find help where you live", support);

      // A lesson range goes to the first lesson in the range; a single lesson
      // to itself. Ranges are matched first so "Lessons 13–16" is not consumed
      // as "Lesson 13".
      out = out.replace(/\bLessons\s+(\d{1,2})\s*[–—-]\s*(\d{1,2})\b/g, (whole, from: string) => {
        const target = findLesson(Number(from));
        if (!target || target.file === selfFile) return whole;
        return `[${whole}](${bysyPageHref(pageSlug(target))})`;
      });
      out = out.replace(/(?<!\[)\bLesson\s+(\d{1,2})\b(?!\])/g, (whole, n: string) => {
        const target = findLesson(Number(n));
        if (!target || target.file === selfFile) return whole;
        return `[${whole}](${bysyPageHref(pageSlug(target))})`;
      });

      // Module pauses, by their own titles.
      for (const pause of pauses) link(pause.label, pause.file);

      // Module 6 references land on its first page.
      link("Module 6", "module-6-01-before-engagement.md");

      return out;
    })
    .join("\n");
}

/* ------------------------------------------------------------- home calls */

/**
 * The course home's three entry points, and its support call.
 *
 * The copy writes them as bold text with an arrow — "**Start here →**" — so
 * they are turned into links here rather than rewritten in the content.
 *
 * "Choose the engagement route" goes to the route chooser with the engagement
 * route showing, never straight to Module 6: the brief and the page's own
 * implementation note both say so, and the route passes through A Note on
 * Safety and the discernment lessons that Module 6 assumes.
 */
export function linkHomeCalls(body: string): string {
  const calls: [string, string][] = [
    ["Start here →", bysyPageHref("00-welcome")],
    ["Find your situation →", bysyPageHref("06-help-me-right-now")],
    ["Choose the engagement route →", `${bysyPageHref("03-choose-your-route")}?route=r4`],
    ["Get support →", bysyPageHref("05-finding-help")],
  ];

  let out = body;
  for (const [text, href] of calls) {
    out = out.split(`**${text}**`).join(`**[${text}](${href})**`);
  }
  return out;
}

/* ------------------------------------------------- the support page (§6) */

export const SUPPORT_FILE = "05-finding-help.md";

/** Where the shared country lists are spliced in. */
const COUNTRY_HEADING = "## Where to begin, by country";

/**
 * The support page, composed from its two sources.
 *
 * Its guidance is course text and lives in the file. Its country lists and its
 * review date come from the shared resources file, so the helplines exist in
 * one place and the date on this page is whatever the shared file actually
 * says — never a copy of it that can fall out of step.
 */
export function readSupportPage(): { markdown: string; missing: string[] } | null {
  const body = readPage(SUPPORT_FILE);
  if (!body) return null;

  const { markdown: countries, missing } = renderSharedSections();
  const date = sharedReviewDate();

  // The review line at the top. When the shared file states no date, §6 wants
  // the review-in-progress notice rather than a date worked out from anything
  // else, so the whole sentence is replaced rather than the date alone.
  let out = body.replace(
    /\*Last reviewed:[^*]*\*/,
    date
      ? `*Last reviewed: ${date}. Helplines, hours and websites change. If a number here does not work, use one of the global directories below — they are maintained by the services themselves.*`
      : `*${REVIEW_IN_PROGRESS}*`
  );

  // The country lists, under the heading the page already carries.
  const at = out.indexOf(COUNTRY_HEADING);
  if (at !== -1) {
    const after = at + COUNTRY_HEADING.length;
    out = out.slice(0, after) + "\n\n" + countries + "\n\n" + out.slice(after);
  }

  return { markdown: out, missing };
}
