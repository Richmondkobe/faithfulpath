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
