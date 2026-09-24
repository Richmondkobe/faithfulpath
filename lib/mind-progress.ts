import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MIND_COURSE_SLUG } from "@/lib/mind-course";
import type { DayStatus } from "@/lib/mind-types";

export type { NextStep, DayStatus } from "@/lib/mind-types";
export {
  NEXT_STEP_LABELS,
  isNextStep,
  DAY_STATUS_LABELS,
  isDayStatus,
} from "@/lib/mind-types";

// Storage for "When Your Mind Won't Rest".
//
// Foundation progress reuses course_progress and course_reflections, keyed on
// this course's slug, exactly as the Spiritual Reset does — so RLS on
// auth.uid() is what keeps a member's answers their own, and nothing here uses
// the service-role client.
//
// The journey is the exception. Its day visits and statuses live in
// course_day_progress, because the manifest requires progress_stored_
// separately_from_foundation and because a day carries two independent facts
// that course_progress has nowhere to put.

/**
 * Reserved question_index values, continuing the convention lib/course-progress.ts
 * established: reflection prompts occupy 0..n, and everything else a page needs
 * to remember sits above 100. The Spiritual Reset uses 100-103; this course
 * starts at 110 so the two can never be confused when reading the table by eye.
 */
export const NEXT_STEP_INDEX = 110;
export const PATH_INDEX = 111;
export const INTENTION_INDEX = 112;
export const ACKNOWLEDGEMENT_INDEX = 113;
export const CHECKIN_INDEX = 114;
export const PATTERN_FINDER_INDEX = 115;
export const LEADERS_ACK_INDEX = 116;
/** The questions that follow a lesson's slides. Private, unscored, optional. */
export const LESSON_QUESTIONS_INDEX = 117;
/** The name a member wants on the certificate, as the other course stores it. */
export const CERT_NAME_INDEX = 103;

/* --------------------------------------------------------- foundation */

export type LessonState = {
  /** The member pressed the finish button. Nothing else sets this. */
  finished: boolean;
  finishedAt: string | null;
};

/** Which foundation lessons the member has marked finished. */
export async function getFinishedLessons(): Promise<Map<string, LessonState>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_progress")
    .select("lesson_slug, completed_at")
    .eq("course_slug", MIND_COURSE_SLUG);

  if (error) throw new Error(`Could not load your progress: ${error.message}`);

  return new Map(
    (data ?? []).map((row) => [
      row.lesson_slug as string,
      {
        finished: Boolean(row.completed_at),
        finishedAt: (row.completed_at as string | null) ?? null,
      },
    ])
  );
}

/** Every stored answer for one page, by question_index. */
export async function getPageAnswers(
  pageSlug: string
): Promise<Map<number, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("question_index, answer")
    .eq("course_slug", MIND_COURSE_SLUG)
    .eq("lesson_slug", pageSlug);

  if (error) throw new Error(`Could not load your answers: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.question_index as number, r.answer as string]));
}

export function readJson<T>(answers: Map<number, string>, index: number): T | null {
  const raw = answers.get(index);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ journey */

export type DayState = {
  day: number;
  visitedAt: string;
  status: DayStatus | null;
  statusAt: string | null;
};

/**
 * The member's journey so far.
 *
 * A row exists once a day has been opened, whatever the member did next — the
 * progress line counts rows, because it reports days visited and not days
 * completed. There are no streaks and nothing is overdue.
 */
export async function getJourneyProgress(): Promise<Map<number, DayState>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_day_progress")
    .select("day, visited_at, status, status_at")
    .eq("course_slug", MIND_COURSE_SLUG);

  if (error) {
    // The table arrives by a hand-applied migration. Until it lands the journey
    // reads as untouched rather than throwing the page away — PostgREST answers
    // PGRST205 when it is not in the schema cache, and 42P01 comes from
    // Postgres itself if the cache is stale rather than empty.
    if (error.code === "PGRST205" || error.code === "42P01") return new Map();
    throw new Error(`Could not load the journey: ${error.message}`);
  }

  return new Map(
    (data ?? []).map((row) => [
      row.day as number,
      {
        day: row.day as number,
        visitedAt: row.visited_at as string,
        status: (row.status as DayStatus | null) ?? null,
        statusAt: (row.status_at as string | null) ?? null,
      },
    ])
  );
}

/** "x of 30 days visited" — the only progress wording the journey uses. */
export function visitedWording(progress: Map<number, DayState>, total = 30): string {
  return `${progress.size} of ${total} days visited`;
}
