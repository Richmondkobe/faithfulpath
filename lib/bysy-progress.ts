import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BYSY_SLUG } from "@/lib/bysy-links";

// Storage for "Before You Say Yes".
//
// Build notes §4 is the shape of this module: what it does NOT hold is the
// point of it. No safety selection, no planned action arising from one, and no
// date or time attached to one is written anywhere — not because a check
// prevents it, but because there is no function here that could.
//
// What it does hold is a route choice, stored as an opaque identifier, and
// ordinary page progress. Both go through the cookie-backed client, so RLS on
// auth.uid() scopes them to the learner.

/** The route choice lives against this page, the route chooser. */
const ROUTE_PAGE = "03-choose-your-route";
/** Reserved index, continuing the convention the other courses use. */
export const ROUTE_INDEX = 120;

/**
 * The learner's route, as an opaque id.
 *
 * Never the descriptive label: a route is a navigation preference, not a
 * relationship finding, and "I am deciding whether to continue" sitting in an
 * account-history screen would say something about the learner that the course
 * has no business recording.
 */
export async function getStoredRoute(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("answer")
    .eq("course_slug", BYSY_SLUG)
    .eq("lesson_slug", ROUTE_PAGE)
    .eq("question_index", ROUTE_INDEX)
    .maybeSingle();

  if (error) return null;
  const value = (data?.answer ?? "").trim();
  return value || null;
}

/* ------------------------------------------------------------------ tools */

/**
 * Where a tool's answers live: one row per page part.
 *
 * Indexed from 200 by part letter, so Part B of a page is always 202 and can be
 * read back without a lookup table. The reserved ranges below 200 belong to the
 * other courses; nothing here writes into them.
 */
export const TOOL_INDEX_BASE = 200;

/**
 * The reserved question_index for one part of one tool.
 *
 * Plain letters keep the numbers they already have: A = 201, B = 202, and so on
 * up to Z = 226. Rows written under that scheme stay where they are.
 *
 * A part may also carry a number — Questions Before Engagement has ten sections
 * and 64 questions, which is past the 40-row cap for a single part, so it
 * stores one part per section. Those live above 300 so they cannot collide with
 * a plain letter. Reading only the first character, as this did, silently
 * mapped Q1 through Q10 onto part Q: ten sections writing over each other in
 * one row, with nothing to see but answers that kept disappearing.
 */
export function toolIndex(part: string): number {
  const match = /^([A-Za-z])(\d{1,2})?$/.exec(part.trim());
  if (!match) throw new Error(`unsupported tool part: ${part}`);

  const letter = match[1].toUpperCase().charCodeAt(0) - 64; // A = 1
  if (!match[2]) return TOOL_INDEX_BASE + letter; // A = 201

  const suffix = Number(match[2]);
  if (suffix < 1 || suffix > 19) throw new Error(`unsupported tool part: ${part}`);
  return 300 + letter * 20 + suffix; // A1 = 321, Q1 = 641
}

/** A tool's stored answers, or null when the learner has written nothing. */
export async function getToolAnswer<T>(
  pageSlug: string,
  part: string
): Promise<T | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_reflections")
    .select("answer")
    .eq("course_slug", BYSY_SLUG)
    .eq("lesson_slug", pageSlug)
    .eq("question_index", toolIndex(part))
    .maybeSingle();

  if (error || !data?.answer) return null;
  try {
    return JSON.parse(data.answer) as T;
  } catch {
    return null;
  }
}
