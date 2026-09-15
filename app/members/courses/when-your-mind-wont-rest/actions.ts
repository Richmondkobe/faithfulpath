"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { MIND_COURSE_SLUG, findPageBySlug } from "@/lib/mind-course";
import { NEXT_STEP_INDEX, isNextStep, type NextStep } from "@/lib/mind-progress";
import { mindLessonHref, MIND_BASE } from "@/lib/mind-links";

/**
 * Every action re-checks the membership. A Server Action is reachable by direct
 * POST, so the page having rendered behind a gate is not itself a control — and
 * writes go through the cookie-backed client, so RLS has to agree the row is
 * theirs as well.
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

/**
 * "Your next faithful step": one of three answers, or none.
 *
 * Private, optional and changeable, and deliberately nothing to do with
 * finishing the lesson — the manifest lists performing the action among the
 * things completion must never depend on. Passing null clears it, because a
 * member who answered "I intend to try this" and then thought better of it
 * should be able to take it back.
 */
export async function saveNextStep(
  lessonSlug: string,
  response: NextStep | null
): Promise<void> {
  if (response !== null && !isNextStep(response)) {
    throw new Error("Unknown response.");
  }
  if (!findPageBySlug(lessonSlug)) throw new Error("Unknown lesson.");

  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: lessonSlug,
      question_index: NEXT_STEP_INDEX,
      answer: response ?? "",
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref(lessonSlug));
}

/**
 * The finish button, and only the finish button.
 *
 * Finishing never depends on the response above, the worksheet, the journal or
 * any check-in. It is also reversible: a member who pressed it and then wanted
 * to sit with the lesson longer can take it back, and nothing is lost.
 */
export async function setLessonFinished(
  lessonSlug: string,
  finished: boolean
): Promise<void> {
  const found = findPageBySlug(lessonSlug);
  if (!found) throw new Error("Unknown lesson.");

  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: lessonSlug,
      completed_at: finished ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref(lessonSlug));
  revalidatePath(MIND_BASE);
}
