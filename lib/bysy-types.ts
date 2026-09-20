// Types shared by the reader and the server.
//
// lib/bysy-course.ts imports node:fs, so a Client Component cannot import from
// it even for a type — the same mistake broke the build twice on the previous
// course. Anything both sides need lives here.

/** One option in a list of next steps, as the page itself writes it. */
export type Choice = {
  id: string;
  title: string;
  body: string;
  /** Says outright that it replaces the others: it takes over the section. */
  replaces: boolean;
  /** Carries a conditional safety caveat: the caveat comes first. */
  caveat: string | null;
};


/** One screen of a "Go deeper" workbook, as the page itself writes it. */
export type Screen = {
  n: number;
  title: string;
  /** "Part 2 — My patterns", when the workbook groups its screens. */
  group?: string | null;
  /** Prose above the questions. */
  body: string;
  /**
   * Prose below the questions, kept separate because it belongs there.
   * Lesson 1's Screen 11 ends with a crisis notice and "Keep this workbook";
   * rendering all the prose first put both of those above the two sentences
   * they are about.
   */
  after?: string;
  /** "How to answer", shown once above the first screen that uses it. */
  instructions?: string;
  prompts: string[];
  options: string[];
  /**
   * What the learner does on this screen.
   *
   * `questions` — one answer per numbered statement.
   * `tick` — a checkbox list written as "☐" bullets; the screen's prose says
   *   whether one or several may be chosen.
   * `write` — one free-text box, for a screen that asks a question without
   *   numbering it.
   * `read` — nothing to fill in. A reading guide is not a form, and giving it
   *   an empty box invites an answer to a question nobody asked.
   */
  kind: "questions" | "tick" | "sort" | "choose" | "write" | "read";
  /** The "☐" items, for a tick screen. */
  ticks: string[];
  /**
   * Whether the screen is one entry the learner adds more of.
   *
   * Lesson 14's Screens 1 and 3 say "Repeat this screen for each person" and
   * "Repeat for each concern or encouragement" — one set of questions, asked
   * again per adviser. A fixed set of boxes lets a learner record one person
   * and quietly lose the rest.
   */
  repeats: boolean;
  /**
   * The named boxes of a sorting screen.
   *
   * Lesson 3's Screen 10 names four — must-haves for everyone, my personal
   * must-haves, nice-to-haves, rules from old hurts — and asks the learner to
   * put each item into one. Without somewhere to write, the exercise could be
   * read and not done.
   */
  categories: string[];
  /**
   * Whether the screen asks for a short example beside each choice.
   *
   * Lesson 2 says "Answer each with Yes / Partly / Not yet, and add one short
   * example"; Lesson 1 says only "choose how true it is for you right now".
   * Offering a box on Lesson 1 asked for writing the page never requested.
   */
  example: boolean;
};
