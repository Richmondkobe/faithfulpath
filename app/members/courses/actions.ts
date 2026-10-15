"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { lessonHref } from "@/lib/course";

// The one action left here: marking a lesson complete, used by Lead Before
// You're Ready. The previous Reset edition's actions (reflections, quizzes,
// check-ins, Day 30, certificate name) went with its pages; what members saved
// through them stays in the database and is still read by the journal and the
// certificate.

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
