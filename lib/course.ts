import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { Checkin } from "@/lib/checkin";

// Course text and quizzes are files in the repo, not database rows: they are
// authored content, they version with the code, and a correction is an ordinary
// edit and redeploy. Only a member's progress and answers go to Supabase.

const ROOT = join(process.cwd(), "content", "courses");

export type LessonType = "teaching" | "session" | "reference";

export type LessonMeta = {
  /**
   * The displayed number for a countable lesson, and what the lessons
   * themselves cite ("read Lesson 24"). It is NOT the sequence — module 3
   * carries 23 and 31-37 while sitting before module 4's 13-22 — so nothing
   * may order by it.
   */
  order: number;
  slug: string;
  title: string;
  source: string;
  type: LessonType;
  file: string;
  module?: string;
  quiz?: string | null;
  reflection?: string | null;
  /** Id of a video to embed above the text. Placeholder until one is recorded. */
  video?: string | null;
  /** The lesson carrying the route buttons. */
  route_choice?: boolean;
};

/**
 * Fields that live only in the lesson file's front matter, not in course.json.
 */
export type LessonFront = {
  outcome?: string;
  /** A single video, placed above Key Scripture (teaching) or Before you begin (session). */
  video?: string;
  /** Several videos, each placed above the heading named in its own front matter. */
  videos: string[];
  /** A session's guided-prayer recording. */
  audio?: string;
  /** Printable PDFs to list in the lesson's Resources box. */
  downloads: string[];
  action?: string;
  action_done?: string;
  action_followup?: string;
  final_action?: string;
  final_done?: string;
  resources: string[];
};

/** A teaching lesson's body, split at the headings the content guarantees. */
export type LessonSections = {
  /** The Key Scripture blockquote, without its heading. */
  keyScripture: string | null;
  /** The condensed teaching. For a session or reference lesson, the whole body. */
  inBrief: string;
  /** Everything from "Read the deeper teaching" to the end, heading excluded. */
  deeper: string | null;
};

export type CourseModule = {
  slug: string;
  title: string;
  lessons: LessonMeta[];
};

export type Course = {
  slug: string;
  title: string;
  description: string;
  modules: CourseModule[];
};

export type QuizQuestion = {
  q: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
};

export type Quiz = {
  /**
   * The retired multiple-choice quiz. Every array is empty in the current
   * content; the component is kept for possible future use, and an empty set
   * renders nothing.
   */
  questions: QuizQuestion[];
  pass_mark: number | null;
  /** Free-text journal prompts. */
  reflection: string[];
  /** The phase 2 check-in, on the four lessons that have one. */
  checkin: Checkin | null;
};

export const getCourse = cache((courseSlug: string): Course | null => {
  try {
    const raw = readFileSync(join(ROOT, courseSlug, "course.json"), "utf8");
    return JSON.parse(raw) as Course;
  } catch {
    return null;
  }
});

/**
 * Every lesson in course order: the array order in course.json, module by
 * module. Deliberately not sorted — see LessonMeta.order.
 */
export const getLessons = cache((courseSlug: string): LessonMeta[] => {
  const course = getCourse(courseSlug);
  if (!course) return [];
  return course.modules.flatMap((m) => m.lessons);
});

/** Look a lesson up by its displayed number, for routes defined in those terms. */
export function lessonByOrder(
  courseSlug: string,
  order: number
): LessonMeta | null {
  return getLessons(courseSlug).find((l) => l.order === order) ?? null;
}

/** The lesson carrying the route buttons, if the course has one. */
export function getRouteLesson(courseSlug: string): LessonMeta | null {
  return getLessons(courseSlug).find((l) => l.route_choice === true) ?? null;
}

/**
 * Lessons that count toward progress. Reference lessons — the resources page and
 * the programme list — are part of the course to read, but there is nothing to
 * complete in them, so they are left out of the count.
 */
export function isCountable(lesson: LessonMeta): boolean {
  return lesson.type !== "reference";
}

export const getCountableLessons = cache((courseSlug: string): LessonMeta[] =>
  getLessons(courseSlug).filter(isCountable)
);

export function findLesson(
  courseSlug: string,
  lessonSlug: string
): { lesson: LessonMeta; module: CourseModule } | null {
  const course = getCourse(courseSlug);
  if (!course) return null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) return { lesson, module: mod };
  }
  return null;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Enough YAML for this content: `key: "value"`, `key: value`, `key: true`, and
 * the one inline list shape used, `resources: [a, b]`. Anything else is
 * ignored rather than guessed at, so a new field shows up as missing instead of
 * as something wrong.
 */
function parseFrontMatter(raw: string): Record<string, string | boolean | string[]> {
  const block = raw.match(FRONT_MATTER)?.[1] ?? "";
  const out: Record<string, string | boolean | string[]> = {};

  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();

    if (value === "true" || value === "false") {
      out[key] = value === "true";
    } else if (value.startsWith("[") && value.endsWith("]")) {
      out[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      out[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

export const getLessonFront = cache(
  (courseSlug: string, file: string): LessonFront => {
    const raw = readFileSync(join(ROOT, courseSlug, file), "utf8");
    const fm = parseFrontMatter(raw);
    const str = (k: string) =>
      typeof fm[k] === "string" && fm[k] ? (fm[k] as string) : undefined;

    return {
      outcome: str("outcome"),
      video: str("video"),
      videos: Array.isArray(fm.videos) ? (fm.videos as string[]) : [],
      audio: str("audio"),
      downloads: Array.isArray(fm.downloads) ? (fm.downloads as string[]) : [],
      action: str("action"),
      action_done: str("action_done"),
      action_followup: str("action_followup"),
      final_action: str("final_action"),
      final_done: str("final_done"),
      resources: Array.isArray(fm.resources) ? (fm.resources as string[]) : [],
    };
  }
);

export const getLessonBody = cache(
  (courseSlug: string, file: string): string => {
    const raw = readFileSync(join(ROOT, courseSlug, file), "utf8");
    return raw.replace(FRONT_MATTER, "").trim();
  }
);

const H2 = (title: string) =>
  new RegExp(`^##\\s+${title}\\s*$`, "im");

/**
 * Splits a teaching lesson into the parts the page lays out separately. A body
 * without the headings — a session or reference lesson — comes back whole in
 * `inBrief`, which is what those layouts render.
 */
export const getLessonSections = cache(
  (courseSlug: string, file: string): LessonSections => {
    const body = getLessonBody(courseSlug, file);

    const deeperMatch = body.match(H2("Read the deeper teaching"));
    const beforeDeeper =
      deeperMatch?.index === undefined ? body : body.slice(0, deeperMatch.index);
    const deeper =
      deeperMatch?.index === undefined
        ? null
        : body.slice(deeperMatch.index + deeperMatch[0].length).trim();

    const keyMatch = beforeDeeper.match(H2("Key Scripture"));
    const briefMatch = beforeDeeper.match(H2("In brief"));

    if (keyMatch?.index === undefined || briefMatch?.index === undefined) {
      return { keyScripture: null, inBrief: beforeDeeper.trim(), deeper };
    }

    const keyScripture = beforeDeeper
      .slice(keyMatch.index + keyMatch[0].length, briefMatch.index)
      .trim();
    const inBrief = beforeDeeper
      .slice(briefMatch.index + briefMatch[0].length)
      .trim();

    return { keyScripture: keyScripture || null, inBrief, deeper };
  }
);

export type Resource = { slug: string; title: string; body: string };

export const getResource = cache(
  (courseSlug: string, slug: string): Resource | null => {
    if (!/^[a-z0-9-]+$/.test(slug)) return null;
    try {
      const raw = readFileSync(
        join(ROOT, courseSlug, "resources", `${slug}.md`),
        "utf8"
      );
      const fm = parseFrontMatter(raw);
      return {
        slug,
        title: typeof fm.title === "string" ? fm.title : slug,
        body: raw.replace(FRONT_MATTER, "").trim(),
      };
    } catch {
      return null;
    }
  }
);

export function resourceHref(courseSlug: string, slug: string): string {
  return `/members/courses/${courseSlug}/resources/${slug}`;
}

/**
 * A lesson's quiz and reflection prompts. Both live in the same JSON file.
 * Retreat sessions have prompts but no questions, and the reference lesson has
 * no file at all, so every field is treated as optional.
 */
export const getQuiz = cache(
  (courseSlug: string, file: string | null | undefined): Quiz | null => {
    if (!file) return null;
    try {
      const raw = readFileSync(join(ROOT, courseSlug, file), "utf8");
      const parsed = JSON.parse(raw) as Partial<Quiz>;
      return {
        questions: parsed.questions ?? [],
        pass_mark: parsed.pass_mark ?? null,
        reflection: parsed.reflection ?? [],
        checkin: parsed.checkin ?? null,
      };
    } catch {
      return null;
    }
  }
);

export function lessonHref(courseSlug: string, lessonSlug: string): string {
  return `/members/courses/${courseSlug}/${lessonSlug}`;
}

/* ------------------------------------------------------------ media scripts */

export type VideoScript = {
  id: string;
  title: string;
  length: string | null;
  /** The heading this video sits immediately above, for a `videos` list. */
  beforeHeading: string | null;
  /** The spoken script, with the italic recording notes removed. */
  script: string;
};

export type AudioScript = {
  id: string;
  title: string;
  length: string | null;
};

/**
 * Whole-line italics in a script are directions to the person recording it —
 * "record this unhurried" — and are never shown to a member.
 */
function stripRecordingNotes(body: string): string {
  return body
    .split(/\n{2,}/)
    .filter((block) => !/^\*[^*][\s\S]*\*$/.test(block.trim()))
    .join("\n\n")
    .trim();
}

export const getVideoScript = cache(
  (courseSlug: string, id: string): VideoScript | null => {
    if (!/^[a-z0-9-]+$/.test(id)) return null;
    try {
      const raw = readFileSync(join(ROOT, courseSlug, "videos", `${id}.md`), "utf8");
      const fm = parseFrontMatter(raw);
      return {
        id,
        title: typeof fm.title === "string" ? fm.title : id,
        length: typeof fm.length === "string" ? fm.length : null,
        beforeHeading:
          typeof fm.before_heading === "string" ? fm.before_heading : null,
        script: stripRecordingNotes(raw.replace(FRONT_MATTER, "")),
      };
    } catch {
      return null;
    }
  }
);

export const getAudioScript = cache(
  (courseSlug: string, id: string): AudioScript | null => {
    if (!/^[a-z0-9-]+$/.test(id)) return null;
    try {
      const raw = readFileSync(join(ROOT, courseSlug, "audio", `${id}.md`), "utf8");
      const fm = parseFrontMatter(raw);
      // The script itself is deliberately not returned: the guided prayer is
      // spoken, and the written prayer already follows in the lesson.
      return {
        id,
        title: typeof fm.title === "string" ? fm.title : id,
        length: typeof fm.length === "string" ? fm.length : null,
      };
    } catch {
      return null;
    }
  }
);

/** The lengths the silence timer offers, from audio/silence-timers.md. */
export const getSilenceLengths = cache((courseSlug: string): number[] => {
  try {
    const raw = readFileSync(
      join(ROOT, courseSlug, "audio", "silence-timers.md"),
      "utf8"
    );
    const fm = parseFrontMatter(raw);
    const lengths = Array.isArray(fm.lengths)
      ? (fm.lengths as string[]).map((n) => Number(n)).filter((n) => n > 0)
      : [];
    return lengths.length > 0 ? lengths : [5, 10, 20, 30];
  } catch {
    return [5, 10, 20, 30];
  }
});

const WORD_MINUTES: Record<string, number> = {
  five: 5,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  "twenty-five": 25,
  thirty: 30,
  forty: 40,
  "forty-five": 45,
  sixty: 60,
};

/**
 * The length a session suggests, written in words in its Silence section —
 * "Suggested length: fifteen minutes". Offered alongside the standard set when
 * it is not already one of them.
 */
export function suggestedSilenceMinutes(body: string): number | null {
  const section = body.split(/^##\s+Silence\s*$/m)[1];
  if (!section) return null;
  const m = section.match(/Suggested length:\s*([a-z-]+)\s*minutes/i);
  if (!m) return null;
  return WORD_MINUTES[m[1].toLowerCase()] ?? null;
}

/** Whether a recording has actually been dropped into public/course-media. */
export function hasMedia(kind: "videos" | "audio", file: string): boolean {
  if (!/^[a-z0-9-]+\.(mp4|mp3)$/.test(file)) return false;
  try {
    return existsSync(join(process.cwd(), "public", "course-media", kind, file));
  } catch {
    return false;
  }
}

/**
 * Splits a lesson body so a component can be placed at a named heading, and
 * returns the pieces in order. Used to put the guided-prayer player under its
 * own heading and each Day-30 video above its week, without the content having
 * to know anything about the page.
 *
 * `at` is the heading line as the content writes it, e.g. "## Silence".
 */
export type BodyPiece =
  | { kind: "markdown"; source: string }
  | { kind: "slot"; id: string };

export function spliceAtHeadings(
  body: string,
  slots: { id: string; heading: string; where: "before" | "after" | "endOfSection" }[]
): BodyPiece[] {
  type Cut = { index: number; id: string };
  const cuts: Cut[] = [];

  for (const slot of slots) {
    const escaped = slot.heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^${escaped}\\s*$`, "m");
    const m = body.match(re);
    if (m?.index === undefined) continue;

    if (slot.where === "before") {
      cuts.push({ index: m.index, id: slot.id });
    } else if (slot.where === "after") {
      cuts.push({ index: m.index + m[0].length, id: slot.id });
    } else {
      // End of the section: just before the next heading of any level, or the
      // end of the body.
      const rest = body.slice(m.index + m[0].length);
      const nextHeading = rest.search(/^#{1,6}\s+/m);
      cuts.push({
        index: nextHeading === -1 ? body.length : m.index + m[0].length + nextHeading,
        id: slot.id,
      });
    }
  }

  cuts.sort((a, b) => a.index - b.index);

  const pieces: BodyPiece[] = [];
  let from = 0;
  for (const cut of cuts) {
    const source = body.slice(from, cut.index).trim();
    if (source) pieces.push({ kind: "markdown", source });
    pieces.push({ kind: "slot", id: cut.id });
    from = cut.index;
  }
  const tail = body.slice(from).trim();
  if (tail) pieces.push({ kind: "markdown", source: tail });

  return pieces;
}

/* ------------------------------------------------------- printable PDFs */

export type CourseDownload = {
  id: string;
  title: string;
  pages: number;
};

/**
 * Titles as the content README specifies them, page counts included — both
 * verified against the PDFs themselves (59 and 43).
 *
 * The files live in the content folder, not public/, so they are served by a
 * route that checks the membership first. Putting them in public/ would make
 * them a plain URL anyone could share.
 */
const DOWNLOADS: Record<string, CourseDownload> = {
  workbook: {
    id: "workbook",
    title: "The Christian Spiritual Reset — Workbook (printable, A4, 59 pages)",
    pages: 59,
  },
  "session-guide": {
    id: "session-guide",
    title: "Retreat Session Guide (printable, A4, 43 pages)",
    pages: 43,
  },
};

/** Resolves a download, and only if the PDF is actually present. */
export function getDownload(
  courseSlug: string,
  id: string
): CourseDownload | null {
  const meta = DOWNLOADS[id];
  if (!meta) return null;
  return downloadPath(courseSlug, id) ? meta : null;
}

/** Absolute path to a download's PDF, or null if it is not there. */
export function downloadPath(courseSlug: string, id: string): string | null {
  if (!/^[a-z0-9-]+$/.test(id) || !/^[a-z0-9-]+$/.test(courseSlug)) return null;
  const path = join(ROOT, courseSlug, "downloads", `${id}.pdf`);
  return existsSync(path) ? path : null;
}

export function downloadHref(courseSlug: string, id: string): string {
  return `/members/courses/${courseSlug}/downloads/${id}`;
}
