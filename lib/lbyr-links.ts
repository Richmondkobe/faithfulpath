/**
 * Slugs, paths and counts for Lead Before You're Ready.
 *
 * Separate from lib/lbyr-course.ts, which reads the source pages with node:fs
 * and so can never be imported into a Client Component. The finish block is a
 * Client Component and needs the course slug; the block renderer needs the
 * Concerns link. Both live here, as lib/mind-links.ts does for the other
 * course.
 */
export const LBYR_SLUG = "lead-before-youre-ready";
export const LBYR_BASE = `/members/courses/${LBYR_SLUG}`;
export const LBYR_LESSON_COUNT = 10;

export const LBYR_MODULES = [
  { label: "Start With Yourself", lessons: [1, 2, 3] },
  { label: "Learn the Craft", lessons: [4, 5, 6, 7] },
  { label: "Face What Tests You", lessons: [8, 9, 10] },
] as const;

export const moduleFor = (order: number): string =>
  LBYR_MODULES.find((m) => (m.lessons as readonly number[]).includes(order))?.label ?? "";

export const lbyrLessonSlug = (order: number) => String(order).padStart(2, "0");
export const lbyrLessonHref = (order: number) =>
  `${LBYR_BASE}/lessons/${lbyrLessonSlug(order)}`;
/**
 * The overview listing all ten lessons.
 *
 * Separate from LBYR_BASE, which sends a member to wherever they are up to.
 * That redirect is the entry point the build brief asked for, but it is not
 * somewhere to go back *to*: a member who has finished the course is sent to
 * the Finish page, so a "Back to the course overview" button pointing at it
 * reloaded the page they were already on.
 */
export const lbyrOverviewHref = `${LBYR_BASE}/lessons`;
export const lbyrStartHereHref = `${LBYR_BASE}/start-here`;
export const lbyrFinishHref = `${LBYR_BASE}/finish`;
export const lbyrConcernsHref = `${LBYR_BASE}/concerns-care-and-reporting`;

/** Whether the course is visible to members. */
export const LBYR_PUBLISHED = true;
