// Where each part of the course lives. Kept apart from lib/mind-course.ts so
// Client Components can build a link without pulling the manifest reader — and
// its node:fs import — into the browser bundle. That is also why the slug is
// declared here rather than imported from the reader: importing it the other
// way round dragged the whole of node:fs into the client chunk.

export const MIND_COURSE_SLUG = "when-your-mind-wont-rest";

export const MIND_BASE = `/members/courses/${MIND_COURSE_SLUG}`;

export function mindHomeHref(): string {
  return MIND_BASE;
}

/** A Start Here page or a numbered lesson — both live under /lessons. */
export function mindLessonHref(slug: string): string {
  return `${MIND_BASE}/lessons/${slug}`;
}

export function mindResourceHref(slug: string): string {
  return `${MIND_BASE}/resources/${slug}`;
}

export function mindCheckinHref(slug: string): string {
  return `${MIND_BASE}/checkins/${slug}`;
}

export function mindJourneyHref(): string {
  return `${MIND_BASE}/journey`;
}

export function mindDayHref(day: number): string {
  return `${MIND_BASE}/journey/${day}`;
}

export function mindLeadersHref(slug?: string): string {
  return slug ? `${MIND_BASE}/leaders/${slug}` : `${MIND_BASE}/leaders`;
}

/**
 * Turn a manifest path into the slug its route uses.
 *
 * The manifest addresses everything by file — "m0/lessons/07-my-mind-is-
 * restless-right-now.md" — and every route is keyed on the bare filename,
 * which is unique across the course.
 */
export function slugFromFile(file: string): string {
  return file.split("/").pop()!.replace(/\.md$/, "");
}
