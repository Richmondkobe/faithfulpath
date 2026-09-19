// Where each part of "Before You Say Yes" lives. Kept apart from the reader so
// a Client Component can build a link without pulling node:fs into the browser
// bundle — the same split the other courses use.

export const BYSY_SLUG = "before-you-say-yes";

export const BYSY_BASE = `/members/courses/${BYSY_SLUG}`;

/**
 * The public resources page — the same helplines as the course's support page,
 * outside the member gate.
 *
 * It is named here because the two pages share more than a source file: anyone
 * reading either of them may be doing it on a device somebody else can see.
 */
export const BYSY_RESOURCES_PATH = `/${BYSY_SLUG}/resources`;

/** The course home. Not one of the 35 content pages. */
export function bysyHomeHref(): string {
  return BYSY_BASE;
}

export function bysyPageHref(slug: string): string {
  return `${BYSY_BASE}/${slug}`;
}

/** The course's own support page — never the public resources page. */
export const BYSY_SUPPORT_SLUG = "05-finding-help";

export function bysySupportHref(): string {
  return bysyPageHref(BYSY_SUPPORT_SLUG);
}

/** The route chooser, where "Choose the engagement route" lands. */
export function bysyRouteChooserHref(routeId?: string): string {
  const base = bysyPageHref("03-choose-your-route");
  return routeId ? `${base}?route=${routeId}` : base;
}

/**
 * Whether the course is reachable from anywhere a learner would find it.
 *
 * It stays false until the pre-publish checklist at the foot of the file list
 * has been run in full. The course exists in the repo and answers on its own
 * URLs meanwhile, which is what lets it be checked at all; what this controls
 * is whether anything links to it.
 *
 * This is one constant rather than a comment asking someone to remember,
 * because the failure it prevents is a course about somebody's safety going
 * live with an unproven §4 item in it.
 */
export const BYSY_PUBLISHED = true;
