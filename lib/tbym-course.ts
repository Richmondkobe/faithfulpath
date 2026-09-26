import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

// "Talk Before You Marry" — the manifest, and the lessons it names.
//
// Like every other course here, the text is files in the repo rather than rows
// in a database: it is authored content, it versions with the code, and a
// correction is an ordinary edit and a redeploy. The only thing this course
// stores about a learner is which lessons they have marked complete, which goes
// through the shared course_progress table and the shared setLessonComplete
// action, not through anything written for this course.
//
// A lesson is one Markdown file. Front matter carries the short fixed fields;
// the body carries the prose, split on the H2 headings the template names. The
// headings are the contract — readLesson fails loudly on a missing one rather
// than rendering a page with a section quietly absent.

export const TBYM_SLUG = "talk-before-you-marry";
export const TBYM_BASE = `/members/courses/${TBYM_SLUG}`;

const ROOT = join(process.cwd(), "content", "courses", TBYM_SLUG);

export type TbymFooterLink = { label: string; href: string | null };

export type TbymLessonEntry = {
  order: number;
  slug: string;
  title: string;
  file: string;
};

export type TbymCourse = {
  slug: string;
  title: string;
  description: string;
  lesson_count: number;
  saved_reflections: boolean;
  footer_links: TbymFooterLink[];
  full_footer_links: TbymFooterLink[];
  notice: string;
  lessons: TbymLessonEntry[];
};

export const getTbymCourse = cache(
  (): TbymCourse => JSON.parse(readFileSync(join(ROOT, "course.json"), "utf8"))
);

/**
 * The eleven sections of the lesson template, as this course stores them.
 *
 * Title, Scripture, the duration line, the completion block and the footer come
 * from front matter or from the manifest; these are the parts written as prose.
 * "tellSomeone" is null on the lessons where the design omits it — 3, 7 and 12 —
 * which is a deliberate absence, not a missing file.
 */
export type TbymLesson = {
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  scriptureText: string;
  scriptureRef: string;
  /**
   * A word about the passage itself, under the reference.
   *
   * Lesson 11 reads the whole of Ephesians 5:21 to 33 because the passage has
   * so often been quoted in halves, and the page says so rather than showing
   * one verse and leaving a learner to assume that is all of it.
   */
  scriptureNote: string | null;
  /**
   * The book chapter this lesson is drawn from, and where it can be read.
   *
   * The number stays whatever the lesson is worth; the link is null until the
   * chapter exists on the site. The Go deeper card is hidden while it is null
   * rather than shown as a dead option, and returns by itself the moment a
   * chapter_href is written into the lesson's front matter.
   */
  chapter: number;
  chapterHref: string | null;
  worksheetTitle: string;
  /** The line under the player. Provisional until the recording is made. */
  duration: string;
  /**
   * A word before the recording starts, on the lessons whose subject makes
   * where and how you listen worth a sentence. The design gives one to Lessons
   * 3, 7 and 12. It sits above the player rather than below it, because a note
   * telling somebody they may prefer headphones is no use after they have
   * pressed play.
   */
  listeningNote: string | null;
  /**
   * The course's closing word, on the last lesson only. It is shown once that
   * lesson is marked complete, where every other lesson offers Continue.
   */
  completionMessage: string | null;
  /** The recording's id in the media bucket, or null while none exists. */
  audio: string | null;
  objectives: string[];
  /**
   * The practice, in the shape the learner works it: an opening line, the
   * stages in order, and a closing permission underneath them. The stages are
   * the lesson's own H3 headings; the closing note is whatever follows the
   * rule at the foot of the section.
   */
  takeOneStep: {
    intro: string;
    stages: { title: string; body: string }[];
    closing: string | null;
  };
  tellSomeone: string | null;
  /** Exactly two, display only. Nothing on this page accepts input. */
  letItSettle: string[];
  needMoreSupport: string;
  transcript: string;
  worksheet: string;
};

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Front matter here is deliberately scalars only; the lists live in the body. */
function parseFront(block: string): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim();
    // Quotes wrap the value; a quote inside it may be escaped, and the
    // backslash must not survive onto the page. Lesson 14's listening note
    // names "Need more support?" and rendered the backslashes until this.
    out[match[1]] =
      value === "null" || value === ""
        ? null
        : value.replace(/^"|"$/g, "").replace(/\\"/g, '"');
  }
  return out;
}

/** Everything under each `## ` heading, keyed by the heading's own text. */
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  const parts = body.split(/^##[ \t]+(.+?)[ \t]*$/m);
  // parts[0] is whatever preceded the first heading, which should be nothing.
  for (let i = 1; i < parts.length; i += 2) {
    sections.set(parts[i].trim(), parts[i + 1].trim());
  }
  return sections;
}

/**
 * "Take one step", split into its stages.
 *
 * Everything before the first H3 is the opening line; each H3 is a stage; and
 * a closing note may follow a `---` rule at the foot of the section, which is
 * how a permission that belongs to the whole practice is kept out of the last
 * stage, where it would read as applying only to that one.
 *
 * A section written as plain paragraphs, with no H3 at all, still works: it
 * becomes the intro and nothing else, which is what the other thirteen lessons
 * will do until someone decides their practice reads better in stages.
 */
function parseStep(source: string): TbymLesson["takeOneStep"] {
  const [before, closing] = source.split(/^---[ \t]*$/m);
  const parts = before.split(/^###[ \t]+(.+?)[ \t]*$/m);

  return {
    intro: parts[0].trim(),
    stages: Array.from({ length: (parts.length - 1) / 2 }, (_, i) => ({
      title: parts[i * 2 + 1].trim(),
      body: parts[i * 2 + 2].trim(),
    })),
    closing: closing?.trim() || null,
  };
}

/** The "- " items of a Markdown list, in order, without their markers. */
function bullets(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.match(/^[-*]\s+(.*)$/)?.[1].trim() ?? "")
    .filter(Boolean);
}

export const readTbymLesson = cache((slug: string): TbymLesson | null => {
  const entry = getTbymCourse().lessons.find((l) => l.slug === slug);
  if (!entry) return null;

  const path = join(ROOT, entry.file);
  if (!existsSync(path)) return null;

  const raw = readFileSync(path, "utf8");
  const front = parseFront(raw.match(FRONT_MATTER)?.[1] ?? "");
  const sections = splitSections(raw.replace(FRONT_MATTER, ""));

  const need = (heading: string): string => {
    const value = sections.get(heading);
    if (!value) {
      // A lesson is not rendered with a hole in it. verify:tbym catches this
      // before a build, and this is the backstop if one ever slips past.
      throw new Error(`${entry.file}: the "${heading}" section is missing or empty`);
    }
    return value;
  };

  return {
    order: entry.order,
    slug: entry.slug,
    title: entry.title,
    subtitle: front.subtitle ?? "",
    scriptureText: front.scripture_text ?? "",
    scriptureRef: front.scripture_ref ?? "",
    scriptureNote: front.scripture_note,
    chapter: Number(front.chapter),
    chapterHref: front.chapter_href,
    worksheetTitle: front.worksheet_title ?? "",
    duration: front.duration ?? "",
    listeningNote: front.listening_note,
    completionMessage: front.completion_message,
    audio: front.audio,
    objectives: bullets(need("In this lesson, you will learn to:")),
    takeOneStep: parseStep(need("Take one step")),
    // Omitted by design on Lessons 3, 7 and 12.
    tellSomeone: sections.get("If it helps, tell someone")?.trim() || null,
    letItSettle: bullets(need("Let it settle")),
    needMoreSupport: need("Need more support?"),
    transcript: need("Transcript"),
    worksheet: need("Worksheet"),
  };
});

/** The lesson after this one, where the course has written it yet. */
export function nextTbymLesson(order: number): TbymLessonEntry | null {
  return getTbymCourse().lessons.find((l) => l.order === order + 1) ?? null;
}

/**
 * Start Here: Before You Begin.
 *
 * Its sections are rendered in the order they are written rather than by name,
 * because this page is prose with headings rather than a fixed template: the
 * lesson contract does not apply to it, and a section added to the file should
 * appear on the page without a code change.
 */
export type TbymStartHere = {
  title: string;
  subtitle: string;
  readingTime: string;
  scriptureRef: string;
  scriptureText: string;
  scriptureNote: string;
  /** What the learner ticks before the way into Lesson 1 appears. */
  acknowledgement: string;
  beginLabel: string;
  sections: { title: string; body: string }[];
};

export const readTbymStartHere = cache((): TbymStartHere => {
  const raw = readFileSync(join(ROOT, "start-here.md"), "utf8");
  const front = parseFront(raw.match(FRONT_MATTER)?.[1] ?? "");
  const body = raw.replace(FRONT_MATTER, "");
  const parts = body.split(/^##[ \t]+(.+?)[ \t]*$/m);

  return {
    title: front.title ?? "",
    subtitle: front.subtitle ?? "",
    readingTime: front.reading_time ?? "",
    scriptureRef: front.scripture_ref ?? "",
    scriptureText: front.scripture_text ?? "",
    scriptureNote: front.scripture_note ?? "",
    acknowledgement: front.acknowledgement ?? "",
    beginLabel: front.begin_label ?? "",
    sections: Array.from({ length: (parts.length - 1) / 2 }, (_, i) => ({
      title: parts[i * 2 + 1].trim(),
      body: parts[i * 2 + 2].trim(),
    })),
  };
});

/**
 * Safety and Support, and the regional directory behind its country chooser.
 *
 * The page's prose is read the same way Start Here's is: sections in the order
 * they are written. "Services in your country" is deliberately an empty section
 * in the file — the chooser is a control, not prose, and the page puts it under
 * that heading.
 */
export type TbymSafety = {
  title: string;
  subtitle: string;
  quickExitLabel: string;
  quickExitNote: string;
  intro: string;
  sections: { title: string; body: string }[];
};

export type TbymSafetyEntry = {
  name: string;
  what: string;
  contact: string;
  hours: string;
  languages: string;
  cost: string;
  phone_bill: string;
  source: string;
  verified: string;
};

export type TbymSafetyCountries = {
  countries: { code: string; name: string; entries: TbymSafetyEntry[] }[];
  international_directory: string | null;
};

export const readTbymSafety = cache((): TbymSafety => {
  const raw = readFileSync(join(ROOT, "safety-and-support.md"), "utf8");
  const front = parseFront(raw.match(FRONT_MATTER)?.[1] ?? "");
  const parts = raw.replace(FRONT_MATTER, "").split(/^##[ \t]+(.+?)[ \t]*$/m);

  return {
    title: front.title ?? "",
    subtitle: front.subtitle ?? "",
    quickExitLabel: front.quick_exit_label ?? "",
    quickExitNote: front.quick_exit_note ?? "",
    intro: front.intro ?? "",
    sections: Array.from({ length: (parts.length - 1) / 2 }, (_, i) => ({
      title: parts[i * 2 + 1].trim(),
      body: parts[i * 2 + 2].trim(),
    })),
  };
});

export const readTbymSafetyCountries = cache(
  (): TbymSafetyCountries =>
    JSON.parse(readFileSync(join(ROOT, "safety-countries.json"), "utf8"))
);

export const tbymSafetyHref = `${TBYM_BASE}/safety-and-support`;

export const tbymStartHereHref = `${TBYM_BASE}/start-here`;

export const tbymLessonHref = (slug: string) => `${TBYM_BASE}/lessons/${slug}`;
export const tbymWorksheetHref = (slug: string) => `${TBYM_BASE}/lessons/${slug}/worksheet`;

/**
 * Built, and deliberately not reachable from the members page.
 *
 * One lesson of fourteen exists. The card goes up when the course does; until
 * then the pages are there to be opened directly and reviewed.
 */
export const TBYM_PUBLISHED = false;
