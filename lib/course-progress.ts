import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRouteLesson, lessonByOrder } from "@/lib/course";
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

export async function getRoute(courseSlug: string): Promise<Route | null> {
  const routeLesson = getRouteLesson(courseSlug);
  if (!routeLesson) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("answer")
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", routeLesson.slug)
    .eq("question_index", ROUTE_ANSWER_INDEX)
    .maybeSingle();

  if (error) throw new Error(`Could not load your route: ${error.message}`);
  return data?.answer === "guided" || data?.answer === "quick" ? data.answer : null;
}

/** The signed-in user's id, or null. Verified with Supabase, not read off a cookie. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

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

/**
 * Where "Start the course" / "Continue" points.
 *
 * A member who has done nothing at all starts at the very beginning, which is
 * the Start Here lesson. Once there is any progress they are resuming, so it
 * moves to the first unfinished countable lesson — reference lessons are never
 * the target, because nothing marks them off and the button would stick there.
 */
export function nextLessonFor<T extends { slug: string }>(
  courseSlug: string,
  all: T[],
  countable: T[],
  progress: Map<string, Progress>,
  route: Route | null
): T {
  const unfinished = (l: { slug: string }) => !progress.get(l.slug)?.completed_at;
  const firstUnfinishedCountable = () =>
    countable.find(unfinished) ?? all[all.length - 1];

  // Quick Start goes to the two essentials and the format page before rejoining
  // the sequence. Named by displayed number, which is how the route is written.
  if (route === "quick") {
    for (const order of [5, 9, 23]) {
      const byOrder = lessonByOrder(courseSlug, order);
      const lesson = byOrder && all.find((l) => l.slug === byOrder.slug);
      if (lesson && unfinished(lesson)) return lesson;
    }
    return firstUnfinishedCountable();
  }

  // Guided is the plain sequence. Someone who has chosen it has started, so
  // they resume rather than being sent back to the welcome.
  if (route === "guided") return firstUnfinishedCountable();

  // No route chosen yet: a member who has done nothing begins at the beginning.
  if (progress.size === 0) return all[0];
  return firstUnfinishedCountable();
}

/**
 * How many of `lessons` are finished. Counting against an explicit list rather
 * than every stored row is what keeps reference lessons out of the total — a
 * member may well mark one complete, and it still should not move the bar.
 */
export function completedCount(
  progress: Map<string, Progress>,
  lessons: { slug: string }[]
): number {
  return lessons.filter((l) => progress.get(l.slug)?.completed_at).length;
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

export function readCheckin(reflections: Map<number, string>): CheckinState | null {
  return parseJson<CheckinState>(reflections.get(CHECKIN_INDEX));
}

export function readDay30(reflections: Map<number, string>): Day30State | null {
  return parseJson<Day30State>(reflections.get(DAY30_INDEX));
}

export function readFollowup(reflections: Map<number, string>): string | null {
  return reflections.get(FOLLOWUP_INDEX) ?? null;
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

export const DAY30_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The Day 30 stage opens 30 days after the first checkbox was ticked, or as
 * soon as the member says their month is done — some will have started the plan
 * before reaching this page, and the date is theirs to judge.
 */
export function day30Available(
  completedAt: string | null | undefined,
  day30: Day30State | null
): boolean {
  if (day30?.monthComplete) return true;
  if (!completedAt) return false;
  return Date.now() - new Date(completedAt).getTime() >= DAY30_MS;
}

/** Whether the member has finished the course: Lesson 28's Day 30 checkbox. */
export async function getCourseComplete(
  courseSlug: string,
  finalLessonSlug: string
): Promise<boolean> {
  return (await getCompletion(courseSlug, finalLessonSlug)).complete;
}
