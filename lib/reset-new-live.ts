/**
 * The switch for the Reset new edition (design, section 14).
 *
 * true:  the new edition is listed on /members, its pages lose the "Test
 *        edition" banner, and the current course's overview says a new edition
 *        is available. The current course stays open as the previous edition.
 * false: everything is exactly as it was before the switch: the new edition is
 *        unlisted and marked as a test.
 *
 * Neither setting reads, moves, copies or changes any member, progress,
 * journal, Day 30 record or certificate. No progress is transferred.
 */
export const RESET_NEW_LIVE = true;
