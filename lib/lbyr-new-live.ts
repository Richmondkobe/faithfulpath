/**
 * The switch for the Lead Before You're Ready new edition.
 *
 * false: a hidden test course. Every one of its addresses, the public Welcome
 *        and Concerns pages included, is "not found" on the live site; they
 *        open only on Vercel preview deployments and on a developer's
 *        computer, with a "Test edition" note in the course bar. The September
 *        edition is unchanged and stays live.
 * true:  (when Richmond says "publish") the course opens on the live site.
 *        Listing it on /members and /courses and retiring the September
 *        edition are made at the same time, as for Talk Before You Marry.
 *
 * Neither setting reads, moves, copies or changes any member or progress.
 */
export const LBYR_NEW_LIVE = false;
