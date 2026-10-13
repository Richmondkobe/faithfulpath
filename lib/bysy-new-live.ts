/**
 * The switch for the Before You Say Yes new edition.
 *
 * false: the new edition is a hidden test course: unlisted, members only, with
 *        a "Test edition" banner. The current course is unchanged.
 * true:  switched on by Richmond, 14 October 2026. The banner becomes a quiet
 *        course bar and the course is listed on /members above the previous
 *        edition. Retiring the previous edition is a separate, later step.
 *
 * Neither setting reads, moves, copies or changes any member or progress.
 */
export const BYSY_NEW_LIVE = true;

/**
 * The previous edition, retired by Richmond on 14 October 2026 (there were no
 * members yet; only his own testing). true: its card leaves /members and every
 * page under /members/courses/before-you-say-yes redirects to the new edition.
 * Nothing is deleted or changed: its pages, progress and saved answers stay
 * where they are, and setting this back to false restores it.
 * The public /before-you-say-yes/resources page is not affected.
 */
export const BYSY_OLD_RETIRED = true;
