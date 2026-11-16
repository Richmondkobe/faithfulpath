/**
 * The parts of the Daily Devotional that the browser needs too. Kept apart
 * from lib/devotional.ts, which reads the devotions from disk and so can
 * only run on the server.
 */

/** The longest reflection a member can write under a devotion. */
export const REFLECTION_MAX = 1000;

/** A member's reflection under a day's devotion (public.devotional_reflections). */
export type Reflection = {
  id: string;
  user_id: string;
  day_seq: number;
  body: string;
  display_name: string;
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  created_at: string;
};
