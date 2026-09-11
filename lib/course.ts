import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

// Course text and quizzes are files in the repo, not database rows: they are
// authored content, they version with the code, and a correction is an ordinary
// edit and redeploy. Only a member's progress and answers go to Supabase.

const ROOT = join(process.cwd(), "content", "courses");

export type LessonType = "teaching" | "session" | "reference";

export type LessonMeta = {
  order: number;
  slug: string;
  title: string;
  source: string;
  type: LessonType;
  file: string;
  quiz?: string;
  reflection?: string;
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

/** Every lesson in reading order, flattened across modules. */
export const getLessons = cache((courseSlug: string): LessonMeta[] => {
  const course = getCourse(courseSlug);
  if (!course) return [];
  return course.modules
    .flatMap((m) => m.lessons)
    .sort((a, b) => a.order - b.order);
});

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
  (courseSlug: string, file: string | undefined): Quiz | null => {
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
