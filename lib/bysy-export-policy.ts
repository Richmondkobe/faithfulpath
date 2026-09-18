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
];

/** Whether a page may contribute anything at all to an export. */
export function pageIsExportable(file: string): boolean {
  return !NEVER_EXPORT.some((e) => e.file === file && e.parts === "all");
}

/** Whether one part of a page may appear in an export. */
export function partIsExportable(file: string, part: string): boolean {
  const rule = NEVER_EXPORT.find((e) => e.file === file);
  if (!rule) return true;
  if (rule.parts === "all") return false;
  return !rule.parts.includes(part.trim().toUpperCase());
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
