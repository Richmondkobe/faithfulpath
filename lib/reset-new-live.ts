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

/**
 * Retiring the previous edition (Richmond, 11 October 2026: no member is taking it).
 *
 * true:  the previous edition's card leaves /members, and its course page and
 *        lesson pages send visitors to the new edition. Nothing is deleted: its
 *        progress, journal entries, check-ins and any certificate stay stored;
 *        the journal page and the journal PDF still show every old entry, and
 *        an issued certificate stays downloadable.
 * false: the previous edition is open again, exactly as before.
 */
export const RESET_OLD_RETIRED = true;
