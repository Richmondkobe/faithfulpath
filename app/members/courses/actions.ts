"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { findLesson, getQuiz, getRouteLesson, lessonHref } from "@/lib/course";
import {
  CHECKIN_INDEX,
  DAY30_INDEX,
  FOLLOWUP_INDEX,
  ROUTE_ANSWER_INDEX,
  type CheckinState,
  type Day30State,
  type Route,
} from "@/lib/course-progress";
import { getQuiz as loadQuiz } from "@/lib/course";
import { matchGuidance, type CheckinAnswers } from "@/lib/checkin";

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

/**
 * Saves the member's chosen route. Stored as the route lesson's answer 0 in
 * course_reflections — see ROUTE_ANSWER_INDEX — so no new table is needed and
 * the existing RLS keeps it private.
 */
export async function saveRoute(
  courseSlug: string,
  route: Route
): Promise<void> {
  if (route !== "guided" && route !== "quick") {
    throw new Error("Unknown route.");
  }

  const { supabase, userId } = await memberClient();
  const routeLesson = getRouteLesson(courseSlug);
  if (!routeLesson) throw new Error("This course has no route choice.");

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: routeLesson.slug,
      question_index: ROUTE_ANSWER_INDEX,
      answer: route,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/members/courses/${courseSlug}`);
  revalidatePath("/members");
}

/** Writes one of the reserved rows above 100 for a lesson. */
async function saveLessonExtra(
  courseSlug: string,
  lessonSlug: string,
  index: number,
  answer: string
): Promise<void> {
  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      question_index: index,
      answer,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);
}

/**
 * Saves a check-in. The outcome is decided here, from the lesson's own JSON,
 * rather than trusting whatever the browser worked out — the urgent path hides
 * the way forward, so it must not be something a client can talk us out of.
 */
export async function saveCheckin(
  courseSlug: string,
  lessonSlug: string,
  answers: CheckinAnswers,
  extra?: { path?: string | null; confirmed?: boolean }
): Promise<{ outcome: string | null }> {
  const found = findLesson(courseSlug, lessonSlug);
  if (!found) throw new Error("Unknown lesson.");

  const checkin = loadQuiz(courseSlug, found.lesson.quiz)?.checkin;
  if (!checkin) throw new Error("This lesson has no check-in.");

  const outcome = checkin.guidance ? (matchGuidance(checkin, answers)?.id ?? null) : null;

  const state: CheckinState = {
    answers,
    outcome,
    path: extra?.path ?? null,
    confirmed: extra?.confirmed ?? false,
    at: new Date().toISOString(),
  };
  await saveLessonExtra(courseSlug, lessonSlug, CHECKIN_INDEX, JSON.stringify(state));

  revalidatePath(lessonHref(courseSlug, lessonSlug));
  return { outcome };
}

export async function saveFollowup(
  courseSlug: string,
  lessonSlug: string,
  value: string
): Promise<void> {
  await saveLessonExtra(courseSlug, lessonSlug, FOLLOWUP_INDEX, value);
  revalidatePath(lessonHref(courseSlug, lessonSlug));
}

/** Sets or clears a lesson's completion, for the "Your next step" checkbox. */
export async function setLessonComplete(
  courseSlug: string,
  lessonSlug: string,
  done: boolean
): Promise<void> {
  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      completed_at: done ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(lessonHref(courseSlug, lessonSlug));
  revalidatePath(`/members/courses/${courseSlug}`);
  revalidatePath("/members");
}

/** The Day 30 stage of Lesson 28: unlocking it early, and finishing the course. */
export async function saveDay30(
  courseSlug: string,
  lessonSlug: string,
  patch: Day30State
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const { data: existing } = await supabase
    .from("course_reflections")
    .select("answer")
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug)
    .eq("question_index", DAY30_INDEX)
    .maybeSingle();

  let current: Day30State = {};
  try {
    current = existing?.answer ? (JSON.parse(existing.answer) as Day30State) : {};
  } catch {
    current = {};
  }

  const next: Day30State = { ...current, ...patch };
  if (patch.finalDone && !current.finalDoneAt) {
    next.finalDoneAt = new Date().toISOString();
  }
  if (patch.finalDone === false) {
    delete next.finalDoneAt;
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      question_index: DAY30_INDEX,
      answer: JSON.stringify(next),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(lessonHref(courseSlug, lessonSlug));
  revalidatePath(`/members/courses/${courseSlug}`);
  revalidatePath("/members");
}
