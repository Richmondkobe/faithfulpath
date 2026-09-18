// Wording the course reuses, so a learner meets one instruction rather than
// several near-identical ones. Client-safe: no node imports.

/**
 * Where a page asks for something §4 forbids storing — a planned action
 * arising from a safety concern, a date attached to one — the instruction
 * stays and this says where it goes instead.
 *
 * One wording everywhere. A learner who meets it on Lesson 6 and again on the
 * Module 4 pause should recognise it rather than read it afresh and wonder
 * whether this page means something different.
 */
export const WRITE_ELSEWHERE = "Write it somewhere outside this course.";

/**
 * The monitoring-privacy note, required by §4 on the tools for Lessons 5, 6, 9
 * to 20 and Questions Before Engagement, and before any download, print, email
 * or share.
 *
 * Deliberately not shown beside every ordinary journal box: §4 says repeating
 * it everywhere makes the course feel unsafe rather than safety-aware.
 */
export const MONITORING_NOTE =
  "Your answers save to your account. If someone may monitor your account, device or browser activity, do not record information here that could place you at risk. Use a safer device where possible, or leave the tool blank and visit Finding Help Where You Live.";

/** §2: every decision section says this, whichever option is chosen. */
export const NOTHING_SCORES =
  "No combination of answers produces this decision, and nothing here is scored.";

/**
 * Longest a single tool field may be.
 *
 * Long enough to name a thing and when it happened, short enough to discourage
 * the narrative detail §4 says these tools must not accumulate. Enforced in the
 * browser and again on the server, so it does not depend on the client.
 */
export const FIELD_LIMIT = 300;
