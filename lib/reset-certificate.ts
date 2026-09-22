import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RESET_SLUG } from "@/lib/reset-simple-links";
import { routeFinished } from "@/lib/reset-simple";

// Whether a learner has finished the Reset's simple layer, for the certificate.
//
// The shape matches getCompletion() in lib/course-progress, which the shared
// certificate route already speaks, so the route can ask this the same way it
// asks that — and answer for a learner who took the simple layer without
// changing anything for the two courses that did not.
//
// Nothing is stored by finishing. The completion date is the latest page the
// route required, read back from progress, so a certificate cannot exist for
// somebody who has not finished and cannot outlive their record if it changes.

export type ResetCompletion = {
  complete: boolean;
  name: string | null;
  finishedAt: string | null;
};

const PLAN_PAGE = "simple-retreat-plan-code";
const CERT_PAGE = "simple-certificate-name";
const INDEX = 0;

export async function resetSimpleCompletion(): Promise<ResetCompletion> {
  const supabase = await createSupabaseServerClient();

  const [{ data: progress }, { data: rows }] = await Promise.all([
    supabase
      .from("course_progress")
      .select("lesson_slug, completed_at")
      .eq("course_slug", RESET_SLUG),
    supabase
      .from("course_reflections")
      .select("lesson_slug, answer")
      .eq("course_slug", RESET_SLUG)
      .eq("question_index", INDEX)
      .in("lesson_slug", [PLAN_PAGE, CERT_PAGE]),
  ]);

  const done = new Map(
    (progress ?? [])
      .filter((r) => r.completed_at)
      .map((r) => [r.lesson_slug as string, r.completed_at as string])
  );
  const plan = (rows ?? []).find((r) => r.lesson_slug === PLAN_PAGE)?.answer ?? null;
  const name = (rows ?? []).find((r) => r.lesson_slug === CERT_PAGE)?.answer?.trim() || null;

  const finish = routeFinished(plan, (slug) => done.has(slug));

  // The certificate belongs to the full course alone — the note is explicit
  // that it goes with that acknowledgement and no other. A one-day or
  // three-hour learner has finished their route and is told so on the page;
  // they are not given a certificate for the whole course.
  if (!finish.finished || finish.kind !== "full") {
    return { complete: false, name, finishedAt: null };
  }

  // When they finished is the last of the pages their route asked for.
  const latest = [...done.values()].sort().pop() ?? null;
  return { complete: true, name, finishedAt: latest };
}
