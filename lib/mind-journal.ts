import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Journal, JournalAnswer, JournalLesson, JournalModule } from "@/lib/journal";
import {
  MIND_COURSE_SLUG,
  getMindCourse,
  readPageFile,
  splitPauseQuestions,
} from "@/lib/mind-course";
import {
  CHECKIN_INDEX,
  INTENTION_INDEX,
  NEXT_STEP_INDEX,
  NEXT_STEP_LABELS,
  isNextStep,
} from "@/lib/mind-progress";

// The member's writing in "When Your Mind Won't Rest", shaped as a Journal so
// the existing export renders it — same page furniture, same PDF, one document
// whichever course it came from.
//
// What this course stores as writing is the two intentions, the module pause
// answers, and the next faithful step recorded against each lesson. Worksheets
// are filled in on paper and never captured; the Pattern Finder's ticks are
// selections rather than writing, and are deliberately left out of the export
// for the same reason they are never labelled: they are not a record of the
// member, and a journal is.
//
// Every read goes through the cookie-backed client, so RLS on auth.uid() is
// what scopes it.

type Row = {
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

export async function getMindJournal(): Promise<Journal | null> {
  const course = getMindCourse();

  const supabase = await createSupabaseServerClient();
  const [reflections, progress] = await Promise.all([
    supabase
      .from("course_reflections")
      .select("lesson_slug, question_index, answer, updated_at")
      .eq("course_slug", MIND_COURSE_SLUG),
    supabase
      .from("course_progress")
      .select("lesson_slug, completed_at")
      .eq("course_slug", MIND_COURSE_SLUG),
  ]);

  if (reflections.error) {
    throw new Error(`Could not load your journal: ${reflections.error.message}`);
  }
  if (progress.error) {
    throw new Error(`Could not load your journal: ${progress.error.message}`);
  }

  const rows = (reflections.data ?? []) as Row[];
  const byPage = new Map<string, Row[]>();
  for (const row of rows) {
    const list = byPage.get(row.lesson_slug) ?? [];
    list.push(row);
    byPage.set(row.lesson_slug, list);
  }
  const completedAt = new Map(
    (progress.data ?? []).map((p) => [p.lesson_slug, p.completed_at as string | null])
  );

  let entryCount = 0;
  let lastWrittenAt: string | null = null;

  const readJson = <T,>(raw: string | undefined): T | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const modules: JournalModule[] = [];

  for (const mod of course.modules) {
    if (mod.id === "m5") continue;
    const lessons: JournalLesson[] = [];

    for (const page of mod.pages) {
      const slug = page.slug ?? page.file.split("/").pop()!.replace(/\.md$/, "");
      const pageRows = byPage.get(slug) ?? [];
      if (pageRows.length === 0) continue;

      const answers: JournalAnswer[] = [];
      let lessonLast: string | null = null;

      // The two intentions, against the prompts they were written under.
      const intentionRow = pageRows.find((r) => r.question_index === INTENTION_INDEX);
      if (intentionRow) {
        const stored = readJson<Record<string, string>>(intentionRow.answer) ?? {};
        const file = readPageFile(page.file);
        const questions =
          ((file?.front.intention as { questions?: { id: string; prompt: string }[] })
            ?.questions ?? []);
        for (const question of questions) {
          const text = (stored[question.id] ?? "").trim();
          if (!text) continue;
          answers.push({
            prompt: question.prompt,
            answer: text,
            updatedAt: intentionRow.updated_at,
          });
          lessonLast = newest(lessonLast, intentionRow.updated_at);
        }
      }

      // The next faithful step, recorded as the step it answers.
      const stepRow = pageRows.find((r) => r.question_index === NEXT_STEP_INDEX);
      const step = stepRow?.answer.trim() ?? "";
      const file = readPageFile(page.file);
      const action = typeof file?.front.action === "string" ? file.front.action : null;

      const nextStep =
        action && isNextStep(step)
          ? {
              action,
              done: Boolean(completedAt.get(slug)),
              doneAt: completedAt.get(slug) ?? null,
              followupPrompt: "Your answer:",
              followupAnswer: NEXT_STEP_LABELS[step],
            }
          : null;

      if (stepRow) lessonLast = newest(lessonLast, stepRow.updated_at);

      if (answers.length === 0 && !nextStep) continue;

      entryCount += answers.length;
      lastWrittenAt = newest(lastWrittenAt, lessonLast);
      lessons.push({
        slug,
        order: page.order ?? 0,
        title: page.title,
        answers,
        nextStep,
        lastWrittenAt: lessonLast,
      });
    }

    // The module's pause, kept with the module it belongs to.
    for (const checkin of mod.checkins ?? []) {
      if (checkin.type !== "pause") continue;
      const slug = checkin.file.split("/").pop()!.replace(/\.md$/, "");
      const row = (byPage.get(slug) ?? []).find((r) => r.question_index === CHECKIN_INDEX);
      if (!row) continue;

      const stored = readJson<Record<string, string>>(row.answer) ?? {};
      const questions = splitPauseQuestions(readPageFile(checkin.file)?.body ?? "").questions;

      const answers: JournalAnswer[] = [];
      questions.forEach((question, i) => {
        const text = (stored[`q${i}`] ?? "").trim();
        if (!text) return;
        answers.push({ prompt: question, answer: text, updatedAt: row.updated_at });
      });

      if (answers.length === 0) continue;
      entryCount += answers.length;
      lastWrittenAt = newest(lastWrittenAt, row.updated_at);
      lessons.push({
        slug,
        order: 99,
        title: checkin.title,
        answers,
        nextStep: null,
        lastWrittenAt: row.updated_at,
      });
    }

    if (lessons.length > 0) modules.push({ title: mod.title, lessons });
  }

  return {
    courseSlug: MIND_COURSE_SLUG,
    courseTitle: course.title,
    modules,
    entryCount,
    lastWrittenAt,
  };
}
