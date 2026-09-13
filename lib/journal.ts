import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCourse,
  getLessonFront,
  getQuiz,
  getRouteLesson,
  type LessonMeta,
} from "@/lib/course";
import { FOLLOWUP_INDEX, ROUTE_ANSWER_INDEX } from "@/lib/course-progress";

// The member's journal: every reflection they have written, plus the next step
// recorded against each lesson, gathered into one structure that both the
// read-only page and the PDF render from.
//
// Every read here goes through the cookie-backed anon client, so RLS on
// auth.uid() is what scopes it to the signed-in member — never the service-role
// client, which would happily return someone else's journal.

/** An answer to one reflection prompt. */
export type JournalAnswer = {
  prompt: string;
  answer: string;
  updatedAt: string | null;
};

/** What the "Your next step" section recorded for a lesson. */
export type JournalNextStep = {
  action: string;
  done: boolean;
  doneAt: string | null;
  /** The follow-up question, on the lessons that ask one. */
  followupPrompt: string | null;
  followupAnswer: string | null;
};

export type JournalLesson = {
  slug: string;
  order: number;
  title: string;
  answers: JournalAnswer[];
  nextStep: JournalNextStep | null;
  /** The most recent time anything in this lesson was written. */
  lastWrittenAt: string | null;
};

export type JournalModule = {
  title: string;
  lessons: JournalLesson[];
};

export type Journal = {
  courseSlug: string;
  courseTitle: string;
  modules: JournalModule[];
  /** Reflections written, across every lesson. */
  entryCount: number;
  lastWrittenAt: string | null;
};

type ReflectionRow = {
  lesson_slug: string;
  question_index: number;
  answer: string;
  updated_at: string;
};

function newest(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) > new Date(b) ? a : b;
}

/**
 * Builds the journal for one course.
 *
 * Only real reflection answers are included. The rows above index 100 hold
 * check-in state, the Day 30 record and the certificate name — machinery, not
 * journal — and the route lesson's answer 0 is the chosen route rather than
 * something the member wrote. See lib/course-progress.ts for that layout.
 */
export async function getJournal(courseSlug: string): Promise<Journal | null> {
  const course = getCourse(courseSlug);
  if (!course) return null;

  const supabase = await createSupabaseServerClient();

  const [reflections, progress] = await Promise.all([
    supabase
      .from("course_reflections")
      .select("lesson_slug, question_index, answer, updated_at")
      .eq("course_slug", courseSlug),
    supabase
      .from("course_progress")
      .select("lesson_slug, completed_at")
      .eq("course_slug", courseSlug),
  ]);

  if (reflections.error) {
    throw new Error(`Could not load your journal: ${reflections.error.message}`);
  }
  if (progress.error) {
    throw new Error(`Could not load your journal: ${progress.error.message}`);
  }

  const rows = (reflections.data ?? []) as ReflectionRow[];
  const byLesson = new Map<string, ReflectionRow[]>();
  for (const row of rows) {
    const list = byLesson.get(row.lesson_slug) ?? [];
    list.push(row);
    byLesson.set(row.lesson_slug, list);
  }

  const completedAt = new Map(
    (progress.data ?? []).map((p) => [p.lesson_slug, p.completed_at as string | null])
  );

  const routeLessonSlug = getRouteLesson(courseSlug)?.slug ?? null;

  let entryCount = 0;
  let lastWrittenAt: string | null = null;

  const buildLesson = (lesson: LessonMeta): JournalLesson | null => {
    const lessonRows = byLesson.get(lesson.slug) ?? [];
    const prompts = getQuiz(courseSlug, lesson.reflection)?.reflection ?? [];
    const front = getLessonFront(courseSlug, lesson.file);

    let lessonLast: string | null = null;

    const answers: JournalAnswer[] = [];
    for (const row of lessonRows) {
      // The route choice is stored as answer 0 of the route lesson, which has
      // no prompts of its own — skip it rather than printing "guided".
      if (lesson.slug === routeLessonSlug && row.question_index === ROUTE_ANSWER_INDEX) {
        continue;
      }
      if (row.question_index >= 100) continue;

      const answer = row.answer.trim();
      if (!answer) continue;

      answers.push({
        prompt: prompts[row.question_index] ?? `Reflection ${row.question_index + 1}`,
        answer,
        updatedAt: row.updated_at,
      });
      lessonLast = newest(lessonLast, row.updated_at);
    }

    // Keep the member's prompts in the order the lesson asks them.
    answers.sort((a, b) => prompts.indexOf(a.prompt) - prompts.indexOf(b.prompt));

    const followupRow = lessonRows.find((r) => r.question_index === FOLLOWUP_INDEX);
    const followupAnswer = followupRow?.answer.trim() || null;
    const done = Boolean(completedAt.get(lesson.slug));

    // A next step is worth recording once the member has done something with
    // it — ticked it off, or answered its follow-up.
    const nextStep: JournalNextStep | null =
      front.action && (done || followupAnswer)
        ? {
            action: front.action,
            done,
            doneAt: completedAt.get(lesson.slug) ?? null,
            followupPrompt: front.action_followup ?? null,
            followupAnswer,
          }
        : null;

    if (followupRow) lessonLast = newest(lessonLast, followupRow.updated_at);
    if (nextStep?.doneAt) lessonLast = newest(lessonLast, nextStep.doneAt);

    if (answers.length === 0 && !nextStep) return null;

    entryCount += answers.length;
    lastWrittenAt = newest(lastWrittenAt, lessonLast);

    return {
      slug: lesson.slug,
      order: lesson.order,
      title: lesson.title,
      answers,
      nextStep,
      lastWrittenAt: lessonLast,
    };
  };

  const modules: JournalModule[] = [];
  for (const mod of course.modules) {
    const lessons = mod.lessons
      .map(buildLesson)
      .filter((l): l is JournalLesson => l !== null);
    if (lessons.length > 0) modules.push({ title: mod.title, lessons });
  }

  return {
    courseSlug,
    courseTitle: course.title,
    modules,
    entryCount,
    lastWrittenAt,
  };
}

/** How the journal writes a date, in both the page and the PDF. */
export function journalDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
