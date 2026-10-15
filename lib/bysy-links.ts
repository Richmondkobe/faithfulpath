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

