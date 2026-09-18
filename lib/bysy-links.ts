// Where each part of "Before You Say Yes" lives. Kept apart from the reader so
// a Client Component can build a link without pulling node:fs into the browser
// bundle — the same split the other courses use.

export const BYSY_SLUG = "before-you-say-yes";

export const BYSY_BASE = `/members/courses/${BYSY_SLUG}`;

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
