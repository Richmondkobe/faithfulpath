import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

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
  questions: QuizQuestion[];
  /** Number of correct answers needed to pass. Absent when there are no questions. */
  pass_mark: number | null;
  /** Free-text journal prompts. */
  reflection: string[];
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

// The body carries YAML front matter that the renderer must not print. The
// fields in it are duplicated in course.json, which is what the app reads, so
// this only has to strip it.
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

export const getLessonBody = cache(
  (courseSlug: string, file: string): string => {
    const raw = readFileSync(join(ROOT, courseSlug, file), "utf8");
    return raw.replace(FRONT_MATTER, "").trim();
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
      };
    } catch {
      return null;
    }
  }
);

export function lessonHref(courseSlug: string, lessonSlug: string): string {
  return `/members/courses/${courseSlug}/${lessonSlug}`;
}
