import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Learner } from "@/lib/following-jesus-access";
import { RESET_NEW_KEY } from "@/lib/reset-new";

/*
 * The member's retreat plan (confirmed on Session 1) and the dated record of
 * participation on the course page (design, section 13).
 *
 * Both live in course_private_answers, under this edition's course_slug only:
 *   page_slug "retreat-plan",     field "plan":  the plan key below;
 *   page_slug "acknowledgements", field = acknowledgement key, value = the ISO
 *   date it was first recorded.
 * New rows only. Acknowledgements are added once and never changed or removed
 * here: a member who later completes a fuller plan receives that one too, and
 * nothing earlier is taken away. Changing the plan changes only the plan row.
 *
 * Through the member's own session (RLS keeps each person to their own rows),
 * never the service-role key. Nothing here touches progress, the journal,
 * certificates or the live course.
 *
 * The wording records participation only, never how well a retreat went. There
 * is no certificate and no score.
 */

export const PLAN_PAGE = "retreat-plan";
export const ACK_PAGE = "acknowledgements";

export const PLANS = {
  three: "Three-day retreat",
  one: "One-day retreat",
  hours: "Three-hour reset",
  home8: "At-home retreat, eight days",
  home12: "At-home retreat, twelve days (extended)",
  couple: "Retreat for couples",
  pastor: "Pastors and leaders",
  group: "Weekly church group",
} as const;
export type PlanKey = keyof typeof PLANS;
const isPlan = (v: string): v is PlanKey => Object.prototype.hasOwnProperty.call(PLANS, v);

export const ACKS = {
  "three-hour": "the Three-Hour Spiritual Reset",
  "one-day": "the One-Day Retreat",
  full: "The Christian Spiritual Reset",
  extended: "The Christian Spiritual Reset: Extended At-Home Retreat",
} as const;
export type AckKey = keyof typeof ACKS;
const ACK_ORDER: AckKey[] = ["three-hour", "one-day", "full", "extended"];

const LESSONS_1_TO_11 = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"].map((n) => `lesson-${n}`);
const s = (...n: number[]) => n.map((x) => `session-${String(x).padStart(2, "0")}`);

/**
 * Which acknowledgements the plan and the completed units earn (design, section 13).
 * "Before My Retreat saved" is met by confirming the plan on Session 1; Lesson 11
 * itself saves nothing. Lessons 12 to 16 are recommended but never required.
 * Session 6 is never required: setting it aside is a legitimate decision.
 */
export function earnedAcks(plan: PlanKey | null, done: Set<string>): AckKey[] {
  if (!plan) return [];
  const all = (slugs: string[]) => slugs.every((x) => done.has(x));
  const lessons = all(LESSONS_1_TO_11);
  const out: AckKey[] = [];
  if (plan === "hours") {
    if (all(s(1, 2, 3, 10))) out.push("three-hour");
  } else if (plan === "one") {
    if (lessons && all(s(1, 2, 3, 10))) out.push("one-day");
  } else {
    if (lessons && all(s(1, 2, 3, 7, 10))) out.push("full");
    if (plan === "home12" && lessons && all(s(1, 2, 3, 4, 5, 7, 8, 9, 10))) out.push("extended");
  }
  return out;
}

/** The member's confirmed plan, or null. */
export async function getPlan(): Promise<PlanKey | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_private_answers")
    .select("value")
    .eq("course_slug", RESET_NEW_KEY)
    .eq("page_slug", PLAN_PAGE)
    .eq("field_key", "plan")
    .maybeSingle();
  // The code, never the message.
  if (error) throw new Error(`Could not load the plan: ${error.code}`);
  return data && isPlan(data.value) ? data.value : null;
}

/** Confirm or change the plan. Only a known plan is accepted. */
export async function savePlan(learner: Learner, value: unknown): Promise<"saved" | "invalid"> {
  if (typeof value !== "string" || !isPlan(value)) return "invalid";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("course_private_answers").upsert(
    { user_id: learner.userId, course_slug: RESET_NEW_KEY, page_slug: PLAN_PAGE, field_key: "plan", value },
    { onConflict: "user_id,course_slug,page_slug,field_key" }
  );
  if (error) throw new Error(`Could not save the plan: ${error.code}`);
  return "saved";
}

export type Ack = { key: AckKey; title: string; date: string };

/** The member's recorded acknowledgements, in order. */
export async function getAcks(): Promise<Ack[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_private_answers")
    .select("field_key, value")
    .eq("course_slug", RESET_NEW_KEY)
    .eq("page_slug", ACK_PAGE);
  if (error) throw new Error(`Could not load the record: ${error.code}`);
  const got = new Map((data ?? []).map((r) => [r.field_key, r.value]));
  return ACK_ORDER.filter((k) => got.has(k)).map((k) => ({ key: k, title: ACKS[k], date: got.get(k) as string }));
}

/**
 * Record any acknowledgement the member has now earned and does not yet have,
 * dated today. Existing ones are left exactly as they are (ignoreDuplicates).
 */
export async function recordAcks(learner: Learner, done: Set<string>): Promise<void> {
  const earned = earnedAcks(await getPlan(), done);
  if (!earned.length) return;
  const today = new Date().toISOString();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("course_private_answers").upsert(
    earned.map((k) => ({ user_id: learner.userId, course_slug: RESET_NEW_KEY, page_slug: ACK_PAGE, field_key: k, value: today })),
    { onConflict: "user_id,course_slug,page_slug,field_key", ignoreDuplicates: true }
  );
  if (error) throw new Error(`Could not record the acknowledgement: ${error.code}`);
}
