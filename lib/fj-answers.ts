import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FjCourse } from "@/lib/following-jesus";
import type { Learner } from "@/lib/following-jesus-access";
import type { PageFields } from "@/lib/fj-answers-page";

// What a learner writes and ticks on a course page: the lesson text boxes,
// Lesson 5's Bible references, the seven-day reading plan, and the My First
// Steps text boxes and four checkboxes.
//
// The pages promise this is private: "saved privately to your account", and
// on My First Steps, "not shared with your group or other learners". So:
//   * every read and write goes through the learner's own session, and RLS on
//     course_private_answers keeps each person to their own rows — never the
//     service-role key;
//   * nothing here logs an answer, emails it, or sends it anywhere but the
//     learner's own row;
//   * no admin page reads this table.

function allowedKeys(fields: PageFields): Map<string, "text" | "check" | number> {
  // A number is a choose-one question: the answer is a position, 1 to that number.
  const keys = new Map<string, "text" | "check" | number>();
  for (let i = 1; i <= fields.texts; i++) keys.set(`text-${i}`, "text");
  for (let i = 1; i <= fields.refs; i++) keys.set(`ref-${i}`, "text");
  for (const id of fields.checks) keys.set(id, "check");
  for (const { name, options } of fields.radios) keys.set(`radio-${name}`, options);
  return keys;
}

export async function getAnswers(course: FjCourse, pageSlug: string): Promise<Record<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_private_answers")
    .select("field_key, value")
    .eq("course_slug", course.key)
    .eq("page_slug", pageSlug);
  if (error) throw new Error(`Could not load answers: ${error.code}`);
  return Object.fromEntries((data ?? []).map((r) => [r.field_key, r.value]));
}

const MAX_VALUE = 20000;

/**
 * Save some of a page's answers. Unknown names, or values of the wrong kind,
 * refuse the whole save rather than storing part of it. A box cleared to
 * nothing, or a box unticked, removes the row: an empty answer is not kept.
 */
export async function saveAnswers(
  learner: Learner,
  course: FjCourse,
  pageSlug: string,
  fields: PageFields,
  changes: unknown
): Promise<"saved" | "invalid"> {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return "invalid";
  const entries = Object.entries(changes as Record<string, unknown>);
  const keys = allowedKeys(fields);
  if (entries.length === 0 || entries.length > keys.size) return "invalid";

  const keep: { key: string; value: string }[] = [];
  const clear: string[] = [];
  for (const [key, value] of entries) {
    const kind = keys.get(key);
    if (!kind || typeof value !== "string" || value.length > MAX_VALUE) return "invalid";
    if (kind === "check" && value !== "1" && value !== "") return "invalid";
    if (typeof kind === "number" && value !== "" && !(/^[1-9]\d*$/.test(value) && Number(value) <= kind)) return "invalid";
    if (value.trim() === "") clear.push(key);
    else keep.push({ key, value });
  }

  const supabase = await createSupabaseServerClient();
  if (keep.length) {
    const { error } = await supabase.from("course_private_answers").upsert(
      keep.map(({ key, value }) => ({
        user_id: learner.userId,
        course_slug: course.key,
        page_slug: pageSlug,
        field_key: key,
        value,
      })),
      { onConflict: "user_id,course_slug,page_slug,field_key" }
    );
    // The code, never the message: a message can quote the row.
    if (error) throw new Error(`Could not save answers: ${error.code}`);
  }
  if (clear.length) {
    const { error } = await supabase
      .from("course_private_answers")
      .delete()
      .eq("course_slug", course.key)
      .eq("page_slug", pageSlug)
      .in("field_key", clear);
    if (error) throw new Error(`Could not clear answers: ${error.code}`);
  }
  return "saved";
}
