/**
 * The switch for the Talk Before You Marry new edition.
 *
 * false: the new edition is a hidden test course: unlisted, members only, with
 *        a "Test edition" banner. The current course is unchanged.
 * true:  switched on by Richmond, 15 October 2026. The banner becomes a quiet
 *        course bar and the course is listed on /members above the previous
 *        edition. Retiring the previous edition is a separate, later step.
 *
 * Neither setting reads, moves, copies or changes any member or progress.
 */
export const TBYM_NEW_LIVE = true;

/**
 * The previous edition, retired by Richmond on 15 October 2026 after he
 * approved the new one. true: its card leaves /members and every page under
 * /members/courses/talk-before-you-marry redirects to the new edition.
 * Nothing is deleted or changed: its pages, progress and any saved answers
 * stay where they are, and setting this back to false restores it.
 */
export const TBYM_OLD_RETIRED = true;
