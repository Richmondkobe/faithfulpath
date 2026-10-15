// The previous Reset edition's completion rule, kept for its certificates.
//
// The edition is retired and its pages removed, but a member who finished it
// can still download the certificate they earned (lib/reset-certificate.ts,
// app/members/courses/[courseSlug]/certificate). This is the rule that decides
// "finished", copied unchanged from the edition's own code: which pages and
// sessions each retreat plan required, and how a session's progress slug
// records the plan it was taken on.

const PART_1_AND_2 = [
  "lesson-01",
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "checkin-01",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
  "lesson-09",
  "checkin-02",
];

const BRING_IT_HOME = ["lesson-20", "lesson-21", "lesson-22", "lesson-23", "lesson-24"];

const ROUTE_REQUIRES: Record<string, { sessions: string[]; pages: string[] }> = {
  p3d: {
    sessions: ["session-01", "session-02", "session-03", "session-04", "session-05", "session-07", "session-10"],
    pages: [...PART_1_AND_2, ...BRING_IT_HOME],
  },
  p1d: {
    sessions: ["session-01", "session-02", "session-03", "session-10"],
    pages: [...PART_1_AND_2, ...BRING_IT_HOME],
  },
  p3h: {
    sessions: ["session-01", "session-02", "session-03", "session-10"],
    pages: BRING_IT_HOME.filter((p) => p !== "lesson-20"),
  },
};

/**
 * Whether the learner has finished their route, and what is next if not.
 *
 * A specialist format is measured against the full course, which its note
 * requires: those retreats are run from their own programme pages, so there is
 * no shorter route to acknowledge.
 *
 * Nothing here is a gate. A learner who has not finished still reaches this
 * page and is told so gently, with the next thing named.
 */
export function routeFinished(
  plan: string | null,
  isDone: (slug: string) => boolean
): { finished: boolean; kind: "full" | "oneday" | "threehour"; next: string | null } {
  const kind = plan === "p1d" ? "oneday" : plan === "p3h" ? "threehour" : "full";
  const spec = ROUTE_REQUIRES[plan ?? "p3d"] ?? ROUTE_REQUIRES.p3d;
  const planFor = plan ?? "p3d";

  for (const slug of spec.pages) {
    if (!isDone(slug)) return { finished: false, kind, next: slug };
  }
  for (const slug of spec.sessions) {
    if (!isDone(sessionProgressSlug(slug, planFor))) {
      return { finished: false, kind, next: slug };
    }
  }
  return { finished: true, kind, next: null };
}

/**
 * A session's progress slug, which carries the route it was finished on.
 *
 * Its note is explicit: finishing the three-hour version does not mark the
 * full version done. They are different lengths of the same session and a
 * learner who later takes the full retreat has not already done it.
 */
function sessionProgressSlug(slug: string, plan: string | null): string {
  return plan ? `${slug}-${plan}` : slug;
}
