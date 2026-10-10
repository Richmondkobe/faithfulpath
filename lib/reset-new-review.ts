import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Learner } from "@/lib/following-jesus-access";
import { RESET_NEW_KEY } from "@/lib/reset-new";

/*
 * My Day 30 Review (Lesson 16 of the Reset new edition): the first thing this
 * edition saves besides progress.
 *
 * Stored in course_private_answers (the table the Following Jesus pages use),
 * under this edition's own course_slug and page_slug "day-30-review". New rows
 * only: it never reads or writes any other course's answers, any progress row,
 * the journal, Day 30 records or certificates of the live course.
 *
 * The page tells the member: not shown to other members, their group or church;
 * reachable by the site's administrator and technical systems only to run and
 * protect the site; changeable and deletable at any time. So:
 *   * every read, write and delete goes through the member's own session, and
 *     RLS on course_private_answers keeps each person to their own rows;
 *     never the service-role key;
 *   * nothing here logs an answer, emails it, or sends it anywhere;
 *   * no admin page reads these rows.
 * Saving a review is separate from completing Lesson 16; neither implies the other.
 */

export const REVIEW_PAGE = "day-30-review";

const TEXT_KEYS = ["grace", "back", "setdown", "testing", "rhythm", "pause", "paragraph"] as const;
const DATE_KEY = "pause-date";
const MAX_VALUE = 20000;

export type Review = { answers: Record<string, string>; savedAt: string | null };

/** The member's own review, and when it was last saved (null if nothing is saved). */
export async function getReview(): Promise<Review> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_private_answers")
    .select("field_key, value, updated_at")
    .eq("course_slug", RESET_NEW_KEY)
    .eq("page_slug", REVIEW_PAGE);
  // The code, never the message: a message can quote the row.
  if (error) throw new Error(`Could not load the review: ${error.code}`);
  const rows = data ?? [];
  const savedAt = rows.reduce<string | null>((latest, r) => (!latest || r.updated_at > latest ? r.updated_at : latest), null);
  return { answers: Object.fromEntries(rows.map((r) => [r.field_key, r.value])), savedAt };
}

/** When the member last saved their review, for the course page; null if never. */
export async function getReviewSavedAt(): Promise<string | null> {
  return (await getReview()).savedAt;
}

/**
 * Save part or all of the review. Unknown boxes, or values of the wrong kind,
 * refuse the whole save. A box cleared to nothing removes its row. No box is required.
 */
export async function saveReview(learner: Learner, changes: unknown): Promise<"saved" | "invalid"> {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return "invalid";
  const entries = Object.entries(changes as Record<string, unknown>);
  if (entries.length === 0 || entries.length > TEXT_KEYS.length + 1) return "invalid";

  const keep: { key: string; value: string }[] = [];
  const clear: string[] = [];
  for (const [key, value] of entries) {
    if (typeof value !== "string" || value.length > MAX_VALUE) return "invalid";
    if (key === DATE_KEY) {
      if (value !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalid";
    } else if (!(TEXT_KEYS as readonly string[]).includes(key)) {
      return "invalid";
    }
    if (value.trim() === "") clear.push(key);
    else keep.push({ key, value });
  }

  const supabase = await createSupabaseServerClient();
  if (keep.length) {
    const { error } = await supabase.from("course_private_answers").upsert(
      keep.map(({ key, value }) => ({
        user_id: learner.userId,
        course_slug: RESET_NEW_KEY,
        page_slug: REVIEW_PAGE,
        field_key: key,
        value,
      })),
      { onConflict: "user_id,course_slug,page_slug,field_key" }
    );
    if (error) throw new Error(`Could not save the review: ${error.code}`);
  }
  if (clear.length) {
    const { error } = await supabase
      .from("course_private_answers")
      .delete()
      .eq("user_id", learner.userId)
      .eq("course_slug", RESET_NEW_KEY)
      .eq("page_slug", REVIEW_PAGE)
      .in("field_key", clear);
    if (error) throw new Error(`Could not clear part of the review: ${error.code}`);
  }
  return "saved";
}

/** "Delete my review": removes every box of the member's own review, and nothing else. */
export async function deleteReview(learner: Learner): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("course_private_answers")
    .delete()
    .eq("user_id", learner.userId)
    .eq("course_slug", RESET_NEW_KEY)
    .eq("page_slug", REVIEW_PAGE);
  if (error) throw new Error(`Could not delete the review: ${error.code}`);
}
