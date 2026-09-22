// Client-safe URLs and the flag for the Reset's simple layer.
//
// lib/reset-simple.ts reads the content from disk, so anything a Client
// Component needs lives here instead — the same split Before You Say Yes uses,
// for the same reason: node:fs must never reach the browser bundle.

export const RESET_SLUG = "christian-spiritual-reset";

export const RESET_BASE = `/members/courses/${RESET_SLUG}`;

export const RESET_SIMPLE_ROOT = `${RESET_BASE}/simple`;

export function resetSimpleHref(slug: string): string {
  return `${RESET_SIMPLE_ROOT}/${slug}`;
}

/**
 * Whether the simple layer is reachable by a learner.
 *
 * False while it is built. The existing 38-page course stays exactly as it is
 * and remains what every member sees; these pages answer on their own URLs so
 * they can be looked at, and nothing links to them. Turning this on is the act
 * of switching the course over, and it is the owner's to make.
 */
export const RESET_SIMPLE_PUBLISHED = true;
