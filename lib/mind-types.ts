// Types and labels for "When Your Mind Won't Rest" — safe to import from Client
// Components. The queries live in lib/mind-progress.ts, which pulls in the
// cookie-backed Supabase client and must never reach the browser.
// (The same split as lib/article.ts and lib/articles-db.ts.)

/** The three answers to "Your next faithful step", as the manifest names them. */
export type NextStep = "intend" | "not_today" | "not_appropriate";

export const NEXT_STEP_LABELS: Record<NextStep, string> = {
  intend: "I intend to try this",
  not_today: "Not today",
  not_appropriate: "This is not appropriate for me",
};

export function isNextStep(value: string): value is NextStep {
  return value === "intend" || value === "not_today" || value === "not_appropriate";
}

/** The four day statuses, in the order the manifest lists them. */
export type DayStatus = "complete" | "skip" | "not_appropriate" | "need_support";

export const DAY_STATUS_LABELS: Record<DayStatus, string> = {
  complete: "Complete",
  skip: "Skip for now",
  not_appropriate: "Not appropriate for me",
  need_support: "I need support",
};

export function isDayStatus(value: string): value is DayStatus {
  return value in DAY_STATUS_LABELS;
}
