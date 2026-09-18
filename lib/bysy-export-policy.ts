// What may never leave this course in a file, to build notes §4 (Export).
//
// This module exists before any export does, deliberately. §5 protects the
// private part of a joint tool inside the interface; an export is a second way
// for the same content to reach the other person, in a file that can be
// forwarded, printed, or simply found. The rule is easy to satisfy while no
// export exists and easy to forget the day one is written, so it is written
// down here as code rather than left as a thing to remember.
//
// Anything added to this course that instructs the learner to answer alone
// belongs in NEVER_EXPORT. When in doubt it belongs there: excluding something
// that could have been included costs a learner an inconvenience, and including
// something that should have been excluded can cost them a great deal more.

/** A page and the parts of it that must never appear in an export. */
export type ExportExclusion = {
  file: string;
  /** Part letters, or "all" for the whole page. */
  parts: string[] | "all";
  why: string;
};

export const NEVER_EXPORT: ExportExclusion[] = [
  {
    file: "lesson-19-when-to-walk-away.md",
    parts: "all",
    why: "Nothing from Lesson 19 is exportable. Part A is not stored at all; B to E are not exportable either.",
  },
  {
    file: "lesson-08-boundaries-without-shame.md",
    parts: ["A"],
    why: "The private part of a joint tool, completed alone and first.",
  },
  {
    file: "lesson-15-can-we-build-a-life.md",
    parts: ["A"],
    why: "The private part of a joint tool, completed alone and first.",
  },
  {
    file: "module-6-02-questions-before-engagement.md",
    parts: ["A"],
    why: "Each person's separately-answered questions, completed alone.",
  },
  {
    file: "lesson-09-sexual-boundaries.md",
    parts: ["A"],
    why: "Answered alone.",
  },
  {
    file: "lesson-12-their-past.md",
    parts: ["A"],
    why: "Answered alone.",
  },
  {
    file: "lesson-07-quiet-green-flags.md",
    parts: ["A", "B", "C"],
    why: 'The page says "Parts A to C are for you alone".',
  },
  {
    file: "lesson-02-equally-yoked.md",
    parts: "all",
    why: 'The tool says "Answer alone, in writing".',
  },
  {
    file: "lesson-04-attraction-is-not-discernment.md",
    parts: "all",
    why: 'The tool says "Answer alone, in writing".',
  },
  {
    file: "lesson-01-why-do-you-want-a-relationship.md",
    parts: "all",
    why: 'The tool says "Answer alone, in writing". Found by the verifier, not by reading.',
  },
  {
    file: "lesson-10-family-patterns.md",
    parts: ["A"],
    why: 'The page says "Part A is yours alone". Found by the verifier, not by reading.',
  },
];

/**
 * Nothing is exportable unless something says it is.
 *
 * This began as a list of exclusions and that was the wrong shape. The course
 * tells learners on "How This Course Works" to complete most tools alone
 * first, and Lessons 2, 4, 7, 8 and 9 each repeat it for their own tool — so a
 * list of what is excluded is always one lesson behind the content, and the
 * lesson it is behind is the one nobody re-read.
 *
 * Default deny puts the burden the right way round: an export has to name what
 * it includes, which is also what §4 requires it to tell the learner. A page
 * added later is private until somebody decides otherwise, rather than public
 * until somebody remembers.
 *
 * EXPORTABLE is empty today because no export exists. Adding to it is a
 * decision about someone's safety, not a convenience.
 */
const EXPORTABLE: { file: string; parts: string[] | "all" }[] = [];

/** Whether a page may contribute anything at all to an export. */
export function pageIsExportable(file: string): boolean {
  if (NEVER_EXPORT.some((e) => e.file === file && e.parts === "all")) return false;
  return EXPORTABLE.some((e) => e.file === file);
}

/** Whether one part of a page may appear in an export. */
export function partIsExportable(file: string, part: string): boolean {
  const letter = part.trim().toUpperCase();

  const never = NEVER_EXPORT.find((e) => e.file === file);
  if (never && (never.parts === "all" || never.parts.includes(letter))) return false;

  const allowed = EXPORTABLE.find((e) => e.file === file);
  if (!allowed) return false;
  return allowed.parts === "all" || allowed.parts.includes(letter);
}

/**
 * The wording any future export must carry.
 *
 * Kept here so an export cannot be built with a gentler version of it. There is
 * deliberately no "export everything" affordance to pair this with: a learner
 * has to know what is in the file before the file exists.
 */
export const EXPORT_WARNING =
  "This file can be read by anyone who obtains it — on your device, in your email, or in print. Choose what to include, and keep it somewhere only you can reach.";
