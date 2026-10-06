import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FjCourse, FjLesson } from "@/lib/following-jesus";
import type { Learner } from "@/lib/following-jesus-access";

// Lesson progress for the Following Jesus courses. A lesson's completion goes
// in course_progress, through the learner's own session, so RLS keeps it to
// their rows. When the last lesson is done, the course's completion goes in
// course_completions — which no browser can write — with the date.

export type CourseProgress = {
  /** Lesson slugs the learner has marked complete. */
  completed: Set<string>;
  /** When the whole course was completed, or null. */
  courseCompletedAt: string | null;
};

export async function getCourseProgress(course: FjCourse): Promise<CourseProgress> {
  const supabase = await createSupabaseServerClient();
  const [lessons, finished] = await Promise.all([
    supabase
      .from("course_progress")
      .select("lesson_slug")
      .eq("course_slug", course.key)
      .not("completed_at", "is", null),
    supabase
      .from("course_completions")
      .select("completed_at")
      .eq("course_slug", course.key)
      .maybeSingle(),
  ]);
  if (lessons.error) throw new Error(`Could not load lesson progress: ${lessons.error.message}`);
  if (finished.error) throw new Error(`Could not load course completion: ${finished.error.message}`);

  const valid = new Set(course.lessons.map((l) => l.slug));
  return {
    completed: new Set((lessons.data ?? []).map((r) => r.lesson_slug).filter((s) => valid.has(s))),
    courseCompletedAt: finished.data?.completed_at ?? null,
  };
}

/**
 * Mark a lesson complete. Marking it again keeps the first date. When this is
 * the last of the course's lessons, the course is recorded as completed.
 */
export async function completeLesson(
  learner: Learner,
  course: FjCourse,
  lesson: FjLesson
): Promise<{ courseCompleted: boolean }> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: readError } = await supabase
    .from("course_progress")
    .select("completed_at")
    .eq("course_slug", course.key)
    .eq("lesson_slug", lesson.slug)
    .maybeSingle();
  if (readError) throw new Error(`Could not read lesson progress: ${readError.message}`);

  if (!existing?.completed_at) {
    const { error } = await supabase.from("course_progress").upsert(
      {
        user_id: learner.userId,
        course_slug: course.key,
        lesson_slug: lesson.slug,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_slug,lesson_slug" }
    );
    if (error) throw new Error(`Could not save lesson progress: ${error.message}`);
  }

  const { completed, courseCompletedAt } = await getCourseProgress(course);
  if (courseCompletedAt) return { courseCompleted: true };
  if (!course.lessons.every((l) => completed.has(l.slug))) return { courseCompleted: false };

  // Every lesson counted, through the learner's own session. Now the record,
  // under the service-role key because nothing in a browser may write it. The
  // unique (user_id, course_slug) keeps the first date if this races.
  const { error } = await supabaseAdmin
    .from("course_completions")
    .insert({ user_id: learner.userId, course_slug: course.key });
  if (error && error.code !== "23505") {
    throw new Error(`Could not record course completion: ${error.message}`);
  }
  return { courseCompleted: true };
}
