// The check-in's types and its rule, kept away from anything that reads disk.
//
// A Client Component needs both — the questions are answered in the browser
// and evaluated there, which is the whole point of them — and lib/reset-simple
// imports node:fs. Importing one from the other pulled fs into the browser
// bundle and took every page down with it.

export type CheckinQuestion = { n: number; prompt: string; options: string[] };
export type CheckinGuidance = { letter: string; title: string; body: string };
export type PathCard = { label: string; body: string };

/**
 * Which guidance a check-in shows, from the answers held in the browser.
 *
 * The rules are the page's own, applied in its order, and the order is the
 * whole of the safety in them: A is checked before B, B before C, so the most
 * serious answer decides what is shown even when a milder rule also matches.
 *
 * Indices, not labels. Nothing that leaves this function carries what the
 * learner said about themselves.
 */
export function checkinGuidanceFor(
  picked: (number | null)[]
): "A" | "B" | "C" | "D" | null {
  const [q1, q2, q3] = picked;
  if (q1 === null || q1 === undefined) return null;
  if (q2 === null || q2 === undefined) return null;
  if (q3 === null || q3 === undefined) return null;

  // A — the two answers that mean silence alone may not be safe at all.
  if (q2 === 4 || q3 === 2) return "A";
  // B — daily life is not being managed, or most days plus a clear effect.
  if (q2 === 3 || (q1 === 2 && q2 === 2)) return "B";
  // C — anything that deserves a shorter or supported retreat.
  if (q3 === 1 || q2 === 1 || q2 === 2 || q1 === 2 || q1 === 3) return "C";
  return "D";
}
