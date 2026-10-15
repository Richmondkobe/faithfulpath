import { readFileSync } from "node:fs";
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

/** The lesson carrying the route buttons, if the course has one. */
export function getRouteLesson(courseSlug: string): LessonMeta | null {
  return getLessons(courseSlug).find((l) => l.route_choice === true) ?? null;
}

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
