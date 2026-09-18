import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

// The shared resources file: one source of truth for the helplines, to build
// notes §6.
//
// The same file produces the public page at /before-you-say-yes/resources and
// the country lists on the course's own support page. Nothing is duplicated
// into the course, so a corrected phone number is corrected in one place and
// both pages change together.

const SHARED = join(process.cwd(), "content", "before-you-say-yes-resources-page.md");

/** The sections the course support page renders, in the order §6 names them. */
export const COURSE_SECTIONS = [
  "Emergency numbers",
  "Global directories",
  "Crisis and emotional support",
  "Domestic abuse, coercion and sexual violence",
  "Forced marriage and family-based coercion",
  "Debt and money",
  "Finding a counsellor",
  "A note on this list",
] as const;

export const readShared = cache((): string | null =>
  existsSync(SHARED) ? readFileSync(SHARED, "utf8") : null
);

/**
 * The review date, read from the shared file rather than written into any page.
 *
 * A date typed into the course page is correct exactly once. The first time the
 * helplines are updated it becomes a claim that someone checked entries they
 * have never seen — and on a page a frightened person is relying on, a stale
 * review date is worse than no date, because it invites trust the file has not
 * earned.
 *
 * Returns null when the shared file states no review date. §6 then requires the
 * review-in-progress notice instead, never a date inferred from when the file
 * was last edited.
 */
export const sharedReviewDate = cache((): string | null => {
  const raw = readShared();
  if (!raw) return null;
  const match = raw.match(/Last reviewed:\s*(\d{1,2}\s+\w+\s+\d{4})/);
  return match?.[1] ?? null;
});

/** §6's wording for a page whose entries have not been verified. */
export const REVIEW_IN_PROGRESS =
  "Resource review in progress. Always confirm current details on the service's official website.";

/**
 * One `## Section` from the shared file, heading included, up to the next `##`.
 *
 * A section named here but absent from the shared file returns null rather than
 * silently rendering nothing, so the caller can say so instead of showing a
 * support page with a hole where the helplines should be.
 */
export function sharedSection(name: string): string | null {
  const raw = readShared();
  if (!raw) return null;

  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${name}`);
  if (start === -1) return null;

  let end = start + 1;
  while (end < lines.length && !/^##\s+(?!#)/.test(lines[end])) end++;

  return lines.slice(start, end).join("\n").trim() || null;
}

export type SharedRender = { markdown: string; missing: string[] };

/** The country lists, as one block of Markdown, plus anything not found. */
export const renderSharedSections = cache((): SharedRender => {
  const parts: string[] = [];
  const missing: string[] = [];

  for (const name of COURSE_SECTIONS) {
    const section = sharedSection(name);
    if (section) parts.push(section);
    else missing.push(name);
  }

  return { markdown: parts.join("\n\n"), missing };
});
