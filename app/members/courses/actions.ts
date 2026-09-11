"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { findLesson, getQuiz, lessonHref } from "@/lib/course";

export type SaveState = { error: string | null; savedAt: number | null };

/**
 * Server actions are reachable by direct POST, so each one re-checks the
 * membership rather than trusting that the page guard ran. Writes go through
 * the cookie-backed client, so RLS also has to agree the row is theirs.
 */
async function memberClient() {
  await requireActiveMember();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

export async function markLessonComplete(
  courseSlug: string,
  lessonSlug: string
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(lessonHref(courseSlug, lessonSlug));
  revalidatePath(`/members/courses/${courseSlug}`);
  revalidatePath("/members");
}

/**
 * Records a quiz attempt. The best score is kept, never the latest, so retrying
 * can only ever help. Passing also completes the lesson.
 */
export async function saveQuizAttempt(
  courseSlug: string,
  lessonSlug: string,
  score: number
): Promise<{ best: number; passed: boolean }> {
  const { supabase, userId } = await memberClient();

  const found = findLesson(courseSlug, lessonSlug);
  if (!found) throw new Error("Unknown lesson.");

  // Bound the score against the file, not against whatever the browser sent.
  const quiz = getQuiz(courseSlug, found.lesson.quiz);
  const total = quiz?.questions.length ?? 0;
  const passMark = quiz?.pass_mark ?? total;
  const safeScore = Math.max(0, Math.min(Math.trunc(score), total));
  const passed = total > 0 && safeScore >= passMark;

  const { data: existing } = await supabase
    .from("course_progress")
    .select("quiz_best_score, quiz_passed, completed_at")
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  const best = Math.max(safeScore, existing?.quiz_best_score ?? 0);
  const everPassed = passed || Boolean(existing?.quiz_passed);

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      quiz_best_score: best,
      quiz_passed: everPassed,
      // Passing completes the lesson; an existing completion is never undone.
      completed_at:
        existing?.completed_at ?? (everPassed ? new Date().toISOString() : null),
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(lessonHref(courseSlug, lessonSlug));
  revalidatePath(`/members/courses/${courseSlug}`);
  revalidatePath("/members");
  return { best, passed: everPassed };
}

export async function saveReflections(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  try {
    const { supabase, userId } = await memberClient();
    const courseSlug = String(formData.get("courseSlug") ?? "");
    const lessonSlug = String(formData.get("lessonSlug") ?? "");

    const found = findLesson(courseSlug, lessonSlug);
    if (!found) return { error: "Unknown lesson.", savedAt: null };

    const prompts = getQuiz(courseSlug, found.lesson.reflection)?.reflection ?? [];
    const rows = prompts.map((_, i) => ({
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      question_index: i,
      answer: String(formData.get(`answer-${i}`) ?? ""),
    }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from("course_reflections")
        .upsert(rows, { onConflict: "user_id,course_slug,lesson_slug,question_index" });
      if (error) return { error: `Could not save: ${error.message}`, savedAt: null };
    }

    revalidatePath(lessonHref(courseSlug, lessonSlug));
    return { error: null, savedAt: Date.now() };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not save your reflection.",
      savedAt: null,
    };
  }
}
