"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { lessonHref } from "@/lib/course";
import { LBYR_LESSON_COUNT, LBYR_SLUG, lbyrLessonSlug } from "@/lib/lbyr-links";
import { LBYR_NEW_LIVE, LBYR_OLD_RETIRED } from "@/lib/lbyr-new-live";

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

/** The September edition's ten lessons: "01" to "10". */
const SEPTEMBER_LESSONS = new Set(
  Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => lbyrLessonSlug(i + 1))
);

/**
 * Sets or clears a lesson's completion, for the "Your next step" checkbox of
 * the September edition of Lead Before You're Ready, its only user.
 *
 * A server action can be called directly, with any arguments, so it accepts
 * only that edition's ten lessons, and nothing at all while the edition is
 * retired (lib/lbyr-new-live.ts). Otherwise a member could set or clear their
 * own completion of any course, the new editions included. Bringing the
 * September edition back makes it work exactly as before.
 */
export async function setLessonComplete(
  courseSlug: string,
  lessonSlug: string,
  done: boolean
): Promise<void> {
  if (LBYR_NEW_LIVE && LBYR_OLD_RETIRED) throw new Error("This edition of the course is retired.");
  if (courseSlug !== LBYR_SLUG || !SEPTEMBER_LESSONS.has(lessonSlug)) throw new Error("Not allowed.");
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
