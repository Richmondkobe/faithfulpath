/**
 * The switches for the Lead Before You're Ready new edition.
 *
 * LBYR_NEW_LIVE
 *   false: a hidden test course. Every one of its addresses, the public Welcome
 *          and Concerns pages included, is "not found" on the live site; they
 *          open only on Vercel preview deployments and on a developer's
 *          computer, with a "Test edition" note in the course bar.
 *   true:  live (Richmond, "publish", 16 October 2026). The course opens on the
 *          live site, its card is on /members, and the Welcome page is listed
 *          on /courses, in the sitemap and open to search engines.
 *
 * LBYR_OLD_RETIRED (only with LBYR_NEW_LIVE)
 *   true:  the September edition is retired: its card leaves /members and
 *          every one of its addresses opens the new edition (next.config.ts;
 *          its Concerns page opens the new Concerns page). Nothing is
 *          deleted: its pages, recordings and members' progress stay stored,
 *          and setting this to false brings it back as it was.
 *
 * Neither setting reads, moves, copies or changes any member or progress.
 */
export const LBYR_NEW_LIVE = true;
export const LBYR_OLD_RETIRED = true;
