"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { BYSY_SLUG, bysyPageHref } from "@/lib/bysy-links";
import { findPage } from "@/lib/bysy-course";
import { toolIndex } from "@/lib/bysy-progress";
import { FIELD_LIMIT } from "@/lib/bysy-wording";

/**
 * Every action re-checks the membership: a Server Action is reachable by direct
 * POST, so a page having rendered behind a gate is not itself a control. Writes
 * go through the cookie-backed client, so RLS has to agree the row is theirs.
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
 * Saves one tool's rows.
 *
 * There is deliberately no action here for a safety selection, a planned action
 * arising from one, or a date attached to one — §4 forbids storing any of them,
 * and the way to honour that is to have no function that could.
 */
export async function saveToolRows(
  pageSlug: string,
  part: string,
  rows: string[][]
): Promise<void> {
  const page = findPage(pageSlug);
  if (!page) throw new Error("Unknown page.");
  if (!/^[A-Z]$/i.test(part.trim())) throw new Error("Unknown part.");

  const { supabase, userId } = await memberClient();

  // Trimmed to the field limit here as well as in the browser: the limit is
  // part of what keeps these from becoming repositories of evidential detail,
  // so it cannot depend on the client having enforced it.
  const clean = rows
    .slice(0, 40)
    .map((row) => row.slice(0, 6).map((cell) => String(cell ?? "").slice(0, FIELD_LIMIT)))
    .filter((row) => row.some((cell) => cell.trim() !== ""));

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: BYSY_SLUG,
      lesson_slug: pageSlug,
      question_index: toolIndex(part),
      answer: JSON.stringify(clean),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(bysyPageHref(pageSlug));
}
