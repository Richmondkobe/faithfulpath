"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * The starting point chosen on Start Here 3, stored as a code and nothing else.
 *
 * The page's implementation note is explicit: the choice is kept as an opaque
 * internal code, and the descriptive label — "I need support before I begin" —
 * must never reach analytics, account history, notifications or an admin
 * summary. Somebody reading a row must learn that a route was chosen, not what
 * the learner said about themselves when choosing it.
 *
 * It is written under a slug of its own rather than the existing course's
 * "00-choose-your-route", which already holds that course's guided/quick
 * answer. Two layers, two rows, neither overwriting the other.
 */
const ROUTE_PAGE = "simple-choose-starting-point";

/** Answer 0 of a page with no prompts of its own is free, as it is elsewhere. */
const ROUTE_INDEX = 0;

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

export async function saveResetRoute(routeId: string): Promise<void> {
  // The codes, and only the codes. An unknown one is rejected rather than
  // stored, so a label can never arrive here by another path.
  if (!/^r[1-3]$/.test(routeId)) throw new Error("Unknown route.");

  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: RESET_SLUG,
      lesson_slug: ROUTE_PAGE,
      question_index: ROUTE_INDEX,
      answer: routeId,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);
}

/** The code already stored, or null. Never the label. */
export async function getResetRoute(): Promise<string | null> {
  await requireActiveMember();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("answer")
    .eq("course_slug", RESET_SLUG)
    .eq("lesson_slug", ROUTE_PAGE)
    .eq("question_index", ROUTE_INDEX)
    .maybeSingle();

  if (error) throw new Error(`Could not load your starting point: ${error.message}`);
  return /^r[1-3]$/.test(data?.answer ?? "") ? (data!.answer as string) : null;
}

/**
 * An optional written answer, saved privately.
 *
 * The pages mark these "*[ Optional: write your answer ]*" and every
 * implementation note says the same three things about them: optional, private,
 * and never a condition of finishing. Nobody reads them — not Richmond, not a
 * counsellor — and the completion checkbox stores nothing of what is written
 * here.
 *
 * Written under the simple page's own slug, so a simple page and the old
 * lesson it came from keep separate rows and neither overwrites the other.
 */
const ANSWER_LIMIT = 4000;

export async function saveResetAnswer(
  pageSlug: string,
  index: number,
  text: string
): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(pageSlug)) throw new Error("Unknown page.");
  if (!Number.isInteger(index) || index < 0 || index > 20) {
    throw new Error("Unknown question.");
  }

  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: RESET_SLUG,
      lesson_slug: pageSlug,
      // Answer 0 on this page's own row. The starting-point code lives under a
      // slug of its own, so nothing here can land on top of it.
      question_index: index,
      answer: text.slice(0, ANSWER_LIMIT),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);
}

/**
 * The retreat chosen on Lesson 5, stored as a code and nothing else.
 *
 * Seven of them: p3d, p1d, p3h for the three lengths, and phome, pcouple,
 * pgroup, pleader for the specialist formats. Like the starting point, the
 * label never travels — a row says which plan, not what the learner said about
 * their life when choosing it.
 *
 * Kept separate from the Start Here route code, which its note requires: they
 * answer different questions and a learner may change one without the other.
 */
const PLAN_PAGE = "simple-retreat-plan-code";

export async function saveResetPlan(planId: string): Promise<void> {
  if (!/^(p3d|p1d|p3h|phome|pcouple|pgroup|pleader)$/.test(planId)) {
    throw new Error("Unknown retreat plan.");
  }

  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: RESET_SLUG,
      lesson_slug: PLAN_PAGE,
      question_index: ROUTE_INDEX,
      answer: planId,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);
}

/** The plan code already stored, or null. Never the label. */
export async function getResetPlan(): Promise<string | null> {
  await requireActiveMember();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("answer")
    .eq("course_slug", RESET_SLUG)
    .eq("lesson_slug", PLAN_PAGE)
    .eq("question_index", ROUTE_INDEX)
    .maybeSingle();

  if (error) throw new Error(`Could not load your retreat plan: ${error.message}`);
  return /^(p3d|p1d|p3h|phome|pcouple|pgroup|pleader)$/.test(data?.answer ?? "")
    ? (data!.answer as string)
    : null;
}
