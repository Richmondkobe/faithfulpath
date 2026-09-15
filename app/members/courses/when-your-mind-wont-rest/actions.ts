"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { MIND_COURSE_SLUG, findPageBySlug, readPageFile } from "@/lib/mind-course";
import {
  ACKNOWLEDGEMENT_INDEX,
  INTENTION_INDEX,
  NEXT_STEP_INDEX,
  PATH_INDEX,
  isNextStep,
  type NextStep,
} from "@/lib/mind-progress";
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

/* ------------------------------------------------------- Start Here */

/**
 * The member's chosen path.
 *
 * Optional — a blank path is a valid answer, and clearing it is allowed. The
 * path only changes which order the course suggests. It never resets
 * completion, journal entries, day visits or day statuses, and nothing in this
 * function touches any of those: it writes one row and stops.
 */
export async function saveMindPath(path: string): Promise<void> {
  const { supabase, userId } = await memberClient();

  const page = readPageFile("m0/lessons/02-choose-your-path-and-pace.md");
  const choice = page?.front.choice as { options?: { id: string }[] } | undefined;
  const allowed = new Set((choice?.options ?? []).map((o) => o.id));

  // An unknown id is stored as no path rather than written through.
  const value = allowed.has(path) ? path : "";

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "02-choose-your-path-and-pace",
      question_index: PATH_INDEX,
      answer: value,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref("02-choose-your-path-and-pace"));
  revalidatePath(MIND_BASE);
}

/**
 * The two intention answers, stored by the stable ids in the page's front
 * matter rather than by position, so reordering the questions later cannot
 * reattach an answer to the wrong prompt.
 *
 * Private and optional: an empty answer is saved as empty and never chased.
 */
export async function saveIntentions(
  answers: Record<string, string>
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const page = readPageFile("m0/lessons/03-before-you-begin.md");
  const intention = page?.front.intention as { questions?: { id: string }[] } | undefined;
  const ids = new Set((intention?.questions ?? []).map((q) => q.id));

  const stored: Record<string, string> = {};
  for (const [id, text] of Object.entries(answers)) {
    if (!ids.has(id)) continue;
    stored[id] = String(text).slice(0, 4000);
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "03-before-you-begin",
      question_index: INTENTION_INDEX,
      answer: JSON.stringify(stored),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref("03-before-you-begin"));
}

/**
 * The three-statement acknowledgement.
 *
 * Only the checked status and the date are stored, as the page's own block
 * specifies — it is not a safety assessment, nothing about the member's state
 * is recorded, and it is excluded from the admin views. It locks nothing: a
 * member who acknowledges none of it keeps the whole course.
 */
export async function saveAcknowledgement(
  checked: Record<string, boolean>
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const page = readPageFile("m0/lessons/04-when-this-course-is-not-enough.md");
  const block = page?.front.acknowledgement as
    | { statements?: { id: string }[] }
    | undefined;
  const ids = (block?.statements ?? []).map((s) => s.id);

  const now = new Date().toISOString();
  const stored: Record<string, { checked: boolean; at: string | null }> = {};
  for (const id of ids) {
    const isChecked = checked[id] === true;
    stored[id] = { checked: isChecked, at: isChecked ? now : null };
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "04-when-this-course-is-not-enough",
      question_index: ACKNOWLEDGEMENT_INDEX,
      answer: JSON.stringify(stored),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref("04-when-this-course-is-not-enough"));
}
