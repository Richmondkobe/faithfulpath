"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import { BYSY_SLUG, bysyPageHref } from "@/lib/bysy-links";
import { findPage, getPages, pageSlug as bysyPageSlug } from "@/lib/bysy-course";
import { findSimplePage } from "@/lib/bysy-simple";

/**
 * A slug this course will write under.
 *
 * Two layers now share these tables: the detailed pages keep their own slugs
 * ("lesson-02-equally-yoked") and the simple pages keep theirs ("lesson-02"),
 * so the two never write to the same row. Anything not in one of those two
 * lists is not a page of this course and gets nothing.
 */
function knownPage(slug: string): boolean {
  return Boolean(findPage(slug) ?? findSimplePage(slug));
}
import { ROUTE_INDEX, toolIndex } from "@/lib/bysy-progress";
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
  if (!knownPage(pageSlug)) throw new Error("Unknown page.");
  // A part is a letter, optionally numbered: Questions Before Engagement stores
  // one part per section. toolIndex() is the real authority and throws on
  // anything else; this rejects the obvious nonsense before it gets there.
  if (!/^[A-Za-z]\d{0,2}$/.test(part.trim())) throw new Error("Unknown part.");

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

/**
 * Fetches the learner's own earlier answers, on request only.
 *
 * §7 says a recall control is collapsed and learner-initiated, and that
 * previous answers are never displayed automatically. Rendering them into a
 * collapsed element would satisfy the letter of that and not the point: the
 * answers would be in the page source, in the browser cache and in anything
 * that saved the page, before the learner asked for anything. On a monitored
 * device that is the exposure the rule exists to prevent.
 *
 * So nothing is fetched until this is called, and it is called only when the
 * learner has read the privacy note and asked twice.
 *
 * Reads go through the cookie-backed client, so RLS returns this member's rows
 * and nobody else's. There is no parameter here for whose answers to fetch.
 */
export async function fetchEarlierAnswers(
  refs: { pageSlug: string; part: string }[]
): Promise<{ pageSlug: string; part: string; rows: string[][] }[]> {
  const { supabase } = await memberClient();

  const wanted = refs
    .filter((r) => findPage(r.pageSlug) && /^[A-Z]$/i.test(r.part.trim()))
    .slice(0, 12);

  const results = await Promise.all(
    wanted.map(async ({ pageSlug, part }) => {
      const { data } = await supabase
        .from("course_reflections")
        .select("answer")
        .eq("course_slug", BYSY_SLUG)
        .eq("lesson_slug", pageSlug)
        .eq("question_index", toolIndex(part))
        .maybeSingle();

      let rows: string[][] = [];
      try {
        const parsed = data?.answer ? JSON.parse(data.answer) : [];
        if (Array.isArray(parsed)) rows = parsed as string[][];
      } catch {
        rows = [];
      }
      return { pageSlug, part, rows };
    })
  );

  return results;
}

/**
 * The completion record, for §2.
 *
 * "The platform's normal completion record applies" — an ordinary
 * course_progress row on the final page, the same row every other course
 * writes. Nothing specially named, nothing that records what the learner
 * concluded, and no route or answer attached to it.
 *
 * What it must never say is anything about readiness. §2 rules out *ready*,
 * *prepared* and *certified*, and the reason is in the sentence after: the name
 * is what a learner may show someone else. A record that says a course about
 * whether to marry someone has been passed is a document that can be used to
 * argue with them.
 */
export async function markCourseComplete(complete: boolean): Promise<void> {
  const { supabase, userId } = await memberClient();
  const final = getPages()[getPages().length - 1];
  const lessonSlug = bysyPageSlug(final);

  if (!complete) {
    // Delete first, and check that it happened. RLS has no delete policy on
    // course_progress, so a delete returns success and removes nothing — the
    // button reported "Removed" while the record sat there. Clearing the
    // timestamp removes the completion either way, and is what the update
    // policy does allow; if neither worked, say so rather than claim it did.
    await supabase
      .from("course_progress")
      .delete()
      .eq("user_id", userId)
      .eq("course_slug", BYSY_SLUG)
      .eq("lesson_slug", lessonSlug);

    const { data: left } = await supabase
      .from("course_progress")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("course_slug", BYSY_SLUG)
      .eq("lesson_slug", lessonSlug)
      .maybeSingle();

    if (left?.completed_at) {
      const { error } = await supabase
        .from("course_progress")
        .update({ completed_at: null })
        .eq("user_id", userId)
        .eq("course_slug", BYSY_SLUG)
        .eq("lesson_slug", lessonSlug);
      if (error) throw new Error(error.message);

      const { data: still } = await supabase
        .from("course_progress")
        .select("completed_at")
        .eq("user_id", userId)
        .eq("course_slug", BYSY_SLUG)
        .eq("lesson_slug", lessonSlug)
        .maybeSingle();
      if (still?.completed_at) throw new Error("The record could not be removed.");
    }
  } else {
    const { error } = await supabase.from("course_progress").upsert(
      {
        user_id: userId,
        course_slug: BYSY_SLUG,
        lesson_slug: lessonSlug,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_slug,lesson_slug" }
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath(bysyPageHref(lessonSlug));
  revalidatePath("/members");
}

/** Whether the completion record exists. */
export async function getCourseComplete(): Promise<boolean> {
  const { supabase, userId } = await memberClient();
  const final = getPages()[getPages().length - 1];
  const { data } = await supabase
    .from("course_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("course_slug", BYSY_SLUG)
    .eq("lesson_slug", bysyPageSlug(final))
    .maybeSingle();
  return Boolean(data?.completed_at);
}

/**
 * Ordinary page progress, for Start Here 4's single acknowledgement.
 *
 * §3 is exact about this one: one button, no tick boxes, no stored
 * per-statement responses, and "stored as ordinary page progress only, never as
 * a specially named record". So it writes the same row every other page would
 * write, and there is deliberately nothing here that could record *what* was
 * acknowledged — only that the page was reached.
 */
export async function recordPageProgress(pageSlug: string): Promise<void> {
  if (!knownPage(pageSlug)) throw new Error("Unknown page.");

  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_slug: BYSY_SLUG,
      lesson_slug: pageSlug,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(error.message);
}

/**
 * The learner's route, stored as an opaque id.
 *
 * Both layers share one row: the detailed course has read this since it was
 * built and nothing ever wrote it, so a route chosen on the simple Start Here
 * 3 is the route the detailed pages report a position against.
 *
 * Only the id — "r3" — is written, never the label. "I am deciding whether to
 * continue" sitting in an account history would say something about the
 * learner's relationship that this course has no business recording, and §7 is
 * explicit that the descriptive label may not appear in analytics, account
 * history, notifications or reflected answers. There is deliberately no
 * parameter here for a label to arrive through.
 */
export async function saveRoute(routeId: string): Promise<void> {
  if (!/^r[1-4]$|^rc$/.test(routeId)) throw new Error("Unknown route.");

  const { supabase, userId } = await memberClient();
  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: BYSY_SLUG,
      lesson_slug: "03-choose-your-route",
      question_index: ROUTE_INDEX,
      answer: routeId,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);
}
