// Client-safe URLs and the flag for the simple layer.
//
// lib/bysy-simple.ts reads the content from disk, so anything a Client
// Component needs lives here instead — the same split the detailed layer uses,
// for the same reason: node:fs must never reach the browser bundle.

import { BYSY_BASE } from "@/lib/bysy-links";

export const SIMPLE_BASE = `${BYSY_BASE}/simple`;

export function simpleHref(slug: string): string {
  return `${SIMPLE_BASE}/${slug}`;
}

/**
 * Whether the simple layer is reachable by a learner.
 *
 * False while it is built. The detailed 35-page course stays exactly as it is
 * and remains what every member sees; these pages answer on their own URLs so
 * they can be looked at, and nothing links to them. Turning this on is the act
 * of switching the course over, and it is the owner's to make.
 */
export const BYSY_SIMPLE_PUBLISHED = true;
