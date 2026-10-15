import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CheckinAnswers } from "@/lib/checkin";

// Progress is the member's own data, so every query here goes through the
// cookie-backed anon client and is authorised by RLS on auth.uid() — never the
// service-role client, which would bypass those policies.

export type Progress = {
  lesson_slug: string;
  completed_at: string | null;
  quiz_best_score: number | null;
  quiz_passed: boolean;
};

export type Reflection = {
  question_index: number;
  answer: string;
};

export type Route = "guided" | "quick";

/**
 * The chosen route is stored as the route lesson's answer 0 in
 * course_reflections. That lesson is a reference lesson with no prompts of its
 * own, so index 0 is free, and reusing the table keeps this to no new
 * migration — the RLS already in place makes it private to the member.
 */
export const ROUTE_ANSWER_INDEX = 0;

export async function getCourseProgress(
  courseSlug: string
): Promise<Map<string, Progress>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_progress")
    .select("lesson_slug, completed_at, quiz_best_score, quiz_passed")
    .eq("course_slug", courseSlug);

  if (error) throw new Error(`Could not load course progress: ${error.message}`);
  return new Map((data ?? []).map((row) => [row.lesson_slug, row as Progress]));
}

export async function getLessonReflections(
  courseSlug: string,
  lessonSlug: string
): Promise<Map<number, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("question_index, answer")
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug);

  if (error) throw new Error(`Could not load reflections: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.question_index, r.answer]));
}

/* ------------------------------------------------- per-lesson extra state */

/**
 * Reflection prompts occupy indexes 0..n, so everything else a lesson needs to
 * remember is kept in the same table above 100. That is what lets phase 2 store
 * check-in answers, the Day 30 stage and the Lesson 11 follow-up without a
 * migration — and the existing RLS keeps all of it private to the member.
 */
export const CHECKIN_INDEX = 100;
export const DAY30_INDEX = 101;
export const FOLLOWUP_INDEX = 102;
/** The name a member wants on their certificate. */
export const CERT_NAME_INDEX = 103;

export type CheckinState = {
  answers: CheckinAnswers;
  /** Id of the guidance rule that matched, for the rule-driven check-ins. */
  outcome?: string | null;
  /** Safety check-in: the path the member chose. */
  path?: string | null;
  confirmed?: boolean;
  at?: string;
};

export type Day30State = {
  /** The member pressed "My month is complete" rather than waiting. */
  monthComplete?: boolean;
  finalDone?: boolean;
  finalDoneAt?: string;
};

function parseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readDay30(reflections: Map<number, string>): Day30State | null {
  return parseJson<Day30State>(reflections.get(DAY30_INDEX));
}

export function readCertificateName(
  reflections: Map<number, string>
): string | null {
  return reflections.get(CERT_NAME_INDEX)?.trim() || null;
}

/**
 * What the course-complete UI needs: whether the course is finished, the name
 * for the certificate, and the date it was finished.
 */
export type Completion = {
  complete: boolean;
  name: string | null;
  finishedAt: string | null;
};

export async function getCompletion(
  courseSlug: string,
  finalLessonSlug: string
): Promise<Completion> {
  const reflections = await getLessonReflections(courseSlug, finalLessonSlug);
  const day30 = readDay30(reflections);
  return {
    complete: Boolean(day30?.finalDone),
    name: readCertificateName(reflections),
    finishedAt: day30?.finalDoneAt ?? null,
  };
}

