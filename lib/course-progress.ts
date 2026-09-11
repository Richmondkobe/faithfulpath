import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  all: T[],
  countable: T[],
  progress: Map<string, Progress>
): T {
  if (progress.size === 0) return all[0];
  return (
    countable.find((l) => !progress.get(l.slug)?.completed_at) ??
    all[all.length - 1]
  );
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
