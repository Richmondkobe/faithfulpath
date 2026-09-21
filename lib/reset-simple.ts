import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import { RESET_SLUG } from "@/lib/reset-simple-links";
import type { CheckinGuidance, CheckinQuestion, PathCard } from "@/lib/reset-checkin";

export type { CheckinGuidance, CheckinQuestion, PathCard };

// The Reset's simple layer: 33 audio-first pages, read from disk.
//
// The 38-page course stays where it is and is still what members see. These
// pages are a second layer over the same material, in the shape Before You Say
// Yes's simple layer uses — a recording, a truth to carry, a step to take, and
// the script kept as the transcript underneath.
//
// Nothing here reaches a Client Component: lib/reset-simple-links.ts holds the
// URLs and the flag, so node:fs stays out of the browser bundle.

const ROOT = join(process.cwd(), "content", "courses", RESET_SLUG, "simple-lessons");

/** The part of the course a page belongs to, as the pages themselves name them. */
export const PART = {
  start: "Start Here",
  understand: "Part 1 — Understand Your Need",
  prepare: "Part 2 — Prepare Your Retreat",
  retreat: "Part 3 — Take Your Retreat",
  home: "Part 4 — Bring It Home",
  finish: "Finish",
  /**
   * The Day 30 Review is a follow-up, not a step of the route. It is left out
   * of the part counts so that finishing the course does not appear to depend
   * on a page a learner reaches a month later.
   */
  followup: "Follow-up",
} as const;

export type ResetPart = (typeof PART)[keyof typeof PART];

export type ResetSimplePage = {
  n: number;
  slug: string;
  file: string;
  title: string;
  part: ResetPart;
  /**
   * The recording for this page, without its extension, or null where a page
   * has none at launch.
   *
   * The three without one are the two check-ins and the Day 30 Review: they
   * ask questions and read back guidance, and a recording would be read over
   * the top of a learner already deciding something.
   */
  audio: string | null;
  /**
   * How long the recording actually runs, to the nearest minute.
   *
   * Measured from the files rather than taken from the pages: a script
   * estimates a length while it is being written, and the recording is what a
   * learner is deciding whether to start.
   */
  length: string | null;
  /**
   * The existing course pages this page's "Go Deeper Library" opens, as each
   * page's own implementation note names them. Several pages name two; the
   * phrase links to the first, and the second is reachable from the library
   * itself. Empty where the note names no single page — the Retreat Plan's
   * depends on the plan chosen, so it is decided when that template is built.
   */
  deeper: string[];
};

/**
 * Every page of the simple layer, in the order a learner meets them.
 *
 * The audio ids are the ones each page's own implementation note names, 01 to
 * 30, and they are the file names in the bucket under
 * `audio/christian-spiritual-reset/`.
 */
export const RESET_SIMPLE_PAGES: ResetSimplePage[] = [
  { n: 1, slug: "welcome", file: "start-01-welcome.md", title: "Welcome", part: PART.start, audio: "01-start-welcome", length: "about 4 minutes" , deeper: ["00-welcome"] },
  { n: 2, slug: "how-to-use", file: "start-02-how-to-use.md", title: "How to Use This Course", part: PART.start, audio: "02-start-how-to-use", length: "about 4 minutes" , deeper: [] },
  { n: 3, slug: "choose-starting-point", file: "start-03-choose-starting-point.md", title: "Choose Your Starting Point", part: PART.start, audio: "03-start-choose-starting-point", length: "about 2 minutes" , deeper: [] },
  { n: 4, slug: "safety-and-support", file: "start-04-safety-and-support.md", title: "Safety and Support", part: PART.start, audio: "04-start-safety-and-support", length: "about 6 minutes" , deeper: ["05-what-a-retreat-can-and-cannot-do"] },

  { n: 5, slug: "lesson-01", file: "lesson-01-when-your-soul-is-tired.md", title: "When Your Soul Is Tired", part: PART.understand, audio: "05-lesson-01", length: "about 6 minutes" , deeper: ["01-when-your-body-keeps-going-but-your-soul-is-tired"] },
  { n: 6, slug: "lesson-02", file: "lesson-02-permission-to-pause.md", title: "You Have Permission to Pause", part: PART.understand, audio: "06-lesson-02", length: "about 7 minutes" , deeper: ["02-retreat-is-not-running-away", "03-jesus-and-the-practice-of-withdrawing"] },
  { n: 7, slug: "lesson-03", file: "lesson-03-what-kind-of-tired.md", title: "What Kind of Tired Are You?", part: PART.understand, audio: "07-lesson-03", length: "about 8 minutes" , deeper: ["04-recognising-burnout-spiritual-dryness-and-emotional-overload"] },
  { n: 8, slug: "lesson-04", file: "lesson-04-what-a-retreat-can-and-cannot-do.md", title: "What a Retreat Can and Cannot Do", part: PART.understand, audio: "08-lesson-04", length: "about 7 minutes" , deeper: ["05-what-a-retreat-can-and-cannot-do"] },
  { n: 9, slug: "checkin-01", file: "checkin-01-is-a-retreat-right-for-me.md", title: "Is a Retreat Right for Me Now?", part: PART.understand, audio: null, length: null , deeper: [] },

  { n: 10, slug: "lesson-05", file: "lesson-05-choose-time-place-retreat.md", title: "Choose Your Retreat, Place and Date", part: PART.prepare, audio: "09-lesson-05", length: "about 6 minutes" , deeper: ["06-choosing-your-retreat-length-and-location", "23-choose-your-retreat-format"] },
  { n: 11, slug: "lesson-06", file: "lesson-06-what-are-you-bringing.md", title: "What Are You Bringing to God?", part: PART.prepare, audio: "10-lesson-06", length: "about 7 minutes" , deeper: ["07-setting-your-intention", "08-preparing-your-heart"] },
  { n: 12, slug: "lesson-07", file: "lesson-07-phone-in-its-place.md", title: "Put Your Phone in Its Place", part: PART.prepare, audio: "11-lesson-07", length: "about 6 minutes" , deeper: ["09-creating-a-digital-boundary"] },
  { n: 13, slug: "lesson-08", file: "lesson-08-pack-simply.md", title: "Pack Simply and Care for Your Body", part: PART.prepare, audio: "12-lesson-08", length: "about 6 minutes" , deeper: ["10-what-to-bring", "11-fasting-food-rest-and-physical-health"] },
  { n: 14, slug: "lesson-09", file: "lesson-09-when-silence-feels-difficult.md", title: "When Silence Feels Difficult", part: PART.prepare, audio: "13-lesson-09", length: "about 7 minutes" , deeper: ["12-what-to-do-when-you-are-afraid-of-silence"] },
  { n: 15, slug: "checkin-02", file: "checkin-02-ready-to-begin.md", title: "Ready to Begin", part: PART.prepare, audio: null, length: null , deeper: [] },

  { n: 16, slug: "retreat-plan", file: "retreat-00-my-retreat-plan.md", title: "My Retreat Plan", part: PART.retreat, audio: "14-retreat-plan", length: "about 4 minutes" , deeper: [] },
  { n: 17, slug: "session-01", file: "session-01-come-as-you-are.md", title: "Come As You Are", part: PART.retreat, audio: "15-session-01", length: "about 6 minutes" , deeper: ["13-come-as-you-are"] },
  { n: 18, slug: "session-02", file: "session-02-be-still.md", title: "Be Still and Become Present", part: PART.retreat, audio: "16-session-02", length: "about 6 minutes" , deeper: ["14-be-still-and-become-present"] },
  { n: 19, slug: "session-03", file: "session-03-put-down-what-you-carry.md", title: "Put Down What You Are Carrying", part: PART.retreat, audio: "17-session-03", length: "about 5 minutes" , deeper: ["15-release-what-you-are-carrying"] },
  { n: 20, slug: "session-04", file: "session-04-honest-prayer.md", title: "Honest Prayer When It Hurts", part: PART.retreat, audio: "18-session-04", length: "about 5 minutes" , deeper: ["16-lament-grief-and-honest-prayer"] },
  { n: 21, slug: "session-05", file: "session-05-confession-and-grace.md", title: "Confession and Grace", part: PART.retreat, audio: "19-session-05", length: "about 7 minutes" , deeper: ["17-confession-and-grace"] },
  { n: 22, slug: "session-06", file: "session-06-forgiving.md", title: "Forgiving Others and Yourself", part: PART.retreat, audio: "20-session-06", length: "about 8 minutes" , deeper: ["18-forgiving-others-and-yourself"] },
  { n: 23, slug: "session-07", file: "session-07-listening.md", title: "Listening for God's Direction", part: PART.retreat, audio: "21-session-07", length: "about 8 minutes" , deeper: ["19-listening-for-god-s-direction"] },
  { n: 24, slug: "session-08", file: "session-08-remember-who-you-are.md", title: "Remember Who You Are", part: PART.retreat, audio: "22-session-08", length: "about 6 minutes" , deeper: ["20-rediscovering-your-identity"] },
  { n: 25, slug: "session-09", file: "session-09-renewing-your-purpose.md", title: "Renewing Your Purpose", part: PART.retreat, audio: "23-session-09", length: "about 7 minutes" , deeper: ["21-renewing-your-purpose"] },
  { n: 26, slug: "session-10", file: "session-10-going-home.md", title: "Going Home With a New Rhythm", part: PART.retreat, audio: "24-session-10", length: "about 6 minutes" , deeper: ["22-returning-with-a-new-rhythm"] },

  { n: 27, slug: "lesson-20", file: "lesson-20-test-what-you-heard.md", title: "Test What You Think You Heard", part: PART.home, audio: "25-lesson-20", length: "about 6 minutes" , deeper: ["24-testing-what-you-believe-you-heard"] },
  { n: 28, slug: "lesson-21", file: "lesson-21-take-one-faithful-step.md", title: "Take One Faithful Step", part: PART.home, audio: "26-lesson-21", length: "about 6 minutes" , deeper: ["25-turning-insight-into-action"] },
  { n: 29, slug: "lesson-22", file: "lesson-22-a-rhythm-you-can-keep.md", title: "Choose a Rhythm You Can Keep", part: PART.home, audio: "27-lesson-22", length: "about 5 minutes" , deeper: ["26-building-a-sustainable-rule-of-life"] },
  { n: 30, slug: "lesson-23", file: "lesson-23-know-when-to-ask-for-help.md", title: "Know When to Ask for Help", part: PART.home, audio: "28-lesson-23", length: "about 5 minutes" , deeper: ["27-when-you-need-a-pastor-counsellor-or-mental-health-professional"] },
  { n: 31, slug: "lesson-24", file: "lesson-24-your-next-30-days.md", title: "Your Next 30 Days", part: PART.home, audio: "29-lesson-24", length: "about 5 minutes" , deeper: ["28-your-30-day-spiritual-renewal-plan"] },

  { n: 32, slug: "welcome-home", file: "finish-welcome-home.md", title: "Welcome Home — My Next Faithful Step", part: PART.finish, audio: "30-finish-welcome-home", length: "about 3 minutes" , deeper: [] },
  { n: 33, slug: "day-30-review", file: "followup-day-30-review.md", title: "Day 30 Review", part: PART.followup, audio: null, length: null , deeper: [] },
];

export function findResetSimplePage(slug: string): ResetSimplePage | null {
  return RESET_SIMPLE_PAGES.find((p) => p.slug === slug) ?? null;
}

/**
 * A page's markdown, with what was addressed to the builder taken out.
 *
 * Two things are removed and neither may ever reach a learner. The
 * implementation note at the foot of every page is an HTML comment, so it
 * would not render — but it is stripped rather than trusted to stay a comment
 * through every later edit. The `<#N#>` markers are MiniMax pause cues written
 * into the audio scripts, deliberate in the recording and meaningless on the
 * page; the retreat-plan note makes stripping them a rule for the whole
 * course, so it is done here, once, rather than in each template.
 */
export function readResetSimplePage(file: string): string | null {
  if (!/^[a-z0-9-]+\.md$/.test(file)) return null;
  try {
    return withoutBuilderText(readFileSync(join(ROOT, file), "utf8"));
  } catch {
    return null;
  }
}

export function withoutBuilderText(markdown: string): string {
  return markdown
    .replace(/<!--\s*IMPLEMENTATION NOTE[\s\S]*?-->/gi, "")
    .replace(/<#\d+#>/g, "")
    // A pause cue sat mid-sentence leaves two spaces behind it.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The page above its "Audio script and transcript" heading. */
export function bodyOf(markdown: string): string {
  const at = markdown.search(/^##\s+Audio script and transcript/im);
  return (at === -1 ? markdown : markdown.slice(0, at)).trim();
}

/**
 * The spoken script, which is also the transcript.
 *
 * The heading is dropped with the production note under it — "(About four
 * minutes. Read slowly…)" is a direction to whoever records, not something a
 * reader opened the transcript for.
 */
export function transcriptOf(markdown: string): string {
  const at = markdown.search(/^##\s+Audio script and transcript/im);
  if (at === -1) return "";
  return markdown
    .slice(at)
    .replace(/^##\s+Audio script and transcript[^\n]*\n/i, "")
    .replace(/^\s*\*\([^)]*\)\*\s*$/gm, "")
    .replace(/\*\[[^\]]*\]\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Where a page sits inside its own part.
 *
 * The count a learner is shown is the part's, not the course's. "1 of 33" is
 * true and useless: it says the course is long at the moment somebody is
 * deciding whether to begin it. "1 of 4" is the promise the part actually
 * makes.
 */
export function placeInPart(page: ResetSimplePage): { n: number; of: number } {
  const inPart = RESET_SIMPLE_PAGES.filter((p) => p.part === page.part);
  return { n: inPart.findIndex((p) => p.slug === page.slug) + 1, of: inPart.length };
}

/**
 * A section split around its "☐ …" completion line.
 *
 * The checkbox belongs where the page puts it: under the instruction it
 * completes, above the divider and the links that follow. Rendering it at the
 * end of the section instead put it below "Go Deeper Library" and "Need
 * support?", where it reads as a step after them rather than the step itself.
 *
 * The plain "Continue: …" line goes at the same time. The next-step button
 * below already does that, and two of them on a page is a reader wondering
 * whether they are different.
 */
export function splitAtStep(
  body: string,
  heading = "Take one step"
): { before: string; label: string | null; after: string } {
  // Only a step section has a completion line. Check-in 2's six boxes are a
  // list to tick and nothing more — its note says exactly six local boxes, and
  // the page is finished by opening My Retreat Plan, not by ticking the last
  // of them. Treating the last box on any page as completion turned that
  // checklist into a five-item list with a control stuck on the end.
  if (!/take one step/i.test(heading)) {
    return { before: body, label: null, after: "" };
  }
  const lines = body.split("\n");
  // The last one. A page may tick several boxes — Lesson 3's five kinds of
  // tiredness, Lesson 8's packing list — and those are local, unsaved marks.
  // The completion line is always the one at the end, phrased as something the
  // learner has done.
  let at = -1;
  lines.forEach((l, i) => {
    if (/^\s*☐\s*\S/.test(l)) at = i;
  });
  const tidy = (part: string[]) =>
    spaceBeforeRules(collapseRules(part.join("\n")))
      .replace(/^\s*\*\*Continue:[^\n]*\*\*\s*$/gm, "")
      // A rule at either end is the page's own divider. The template draws
      // that line itself, around the checkbox, so keeping this one would
      // print it twice.
      .replace(/^\s*(?:-{3,}[ \t]*(?:\n|$))+/, "")
      .replace(/(?:(?:^|\n)[ \t]*-{3,}[ \t]*)+$/, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  if (at === -1) return { before: tidy(lines), label: null, after: "" };
  return {
    before: tidy(lines.slice(0, at)),
    // The files bold some of these. The label is a control's words, not prose.
    label:
      /^\s*☐\s*(.+?)\s*$/
        .exec(lines[at])?.[1]
        ?.replace(/^\*\*(.+)\*\*$/, "$1")
        .replace(/^\*(.+)\*$/, "$1") ?? null,
    after: tidy(lines.slice(at + 1)),
  };
}

/**
 * The two landmarks the pages name in prose, turned into real links.
 *
 * Every page ends by pointing at the Go Deeper Library and at Safety and
 * Support, and both were words rather than ways there. The destinations are
 * per page — each implementation note names its own — so they are passed in
 * rather than guessed at here.
 *
 * A heading is left alone, and so is a phrase already inside a link: a linked
 * heading reads as a fault, and linking a link produces nothing that works.
 * The Safety and Support page does not link to itself.
 */
export function linkLandmarks(
  body: string,
  to: { deeper: string | null; safety: string | null; help?: string | null }
): string {
  const link = (line: string, text: string, href: string | null) => {
    if (!href) return line;
    if (new RegExp(`\\[[^\\]]*${text}[^\\]]*\\]\\(`).test(line)) return line;
    return line.replace(text, `[${text}](${href})`);
  };

  return body
    .split("\n")
    .map((line) => {
      if (/^\s{0,3}#/.test(line)) return line;
      // The help marker is a control written as a bracketed label. Rendered
      // as markdown it is words that look like a button and do nothing, on the
      // page a learner in trouble reaches first.
      if (to.help) {
        // The files name the same destination three ways — "Get Help Now" near
        // the top of a page, "Find support where I live" in a crisis block,
        // "Help me find support where I live" at the foot. All three are the
        // one page, and all three were words in brackets.
        const marker =
          /^\s*\*\*\[\s*(Get Help Now|(?:Help me )?[Ff]ind support where I live)\s*\]\*\*\s*$/;
        const m = marker.exec(line);
        if (m) return `**[${m[1]}](${to.help})**`;
      }
      let out = link(line, "Go Deeper Library", to.deeper);
      out = link(out, "Safety and Support", to.safety);
      return out;
    })
    .join("\n");
}

/**
 * Start Here 3's "[ Card ]" blocks, as data.
 *
 * The file writes each starting point as a bold marker followed by the line
 * that explains it. Rendered as markdown they are words that look like
 * buttons and do nothing, which is what the page would otherwise be: a choice
 * a learner cannot make.
 *
 * The order is the file's, and the code is positional — r1, r2, r3 — because
 * the note gives the destinations in that order and says the code is all that
 * may be stored.
 */
export function routeCards(
  body: string
): { id: "r1" | "r2" | "r3"; label: string; body: string }[] {
  const out: { id: "r1" | "r2" | "r3"; label: string; body: string }[] = [];
  const lines = body.split("\n");
  const ids = ["r1", "r2", "r3"] as const;

  lines.forEach((line, i) => {
    const m = /^\*\*\[\s*Card\s*\]\s*(.+?)\s*\*\*$/.exec(line.trim());
    if (!m || out.length >= 3) return;
    const next = (lines[i + 1] ?? "").trim();
    out.push({ id: ids[out.length], label: m[1], body: next });
  });
  return out;
}

/** The section's prose with its "[ Card ]" blocks taken out. */
export function withoutRouteCards(body: string): string {
  const lines = body.split("\n");
  const drop = new Set<number>();
  lines.forEach((line, i) => {
    if (/^\*\*\[\s*Card\s*\]/.test(line.trim())) {
      drop.add(i);
      drop.add(i + 1);
    }
  });
  return lines
    .filter((_, i) => !drop.has(i))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * The "**[ … ]**" labels the files write their controls as.
 *
 * Rendered as markdown they are words inside brackets that look like buttons
 * and do nothing. Every one of them is a control somewhere — a timer, a way
 * on, a way to help — so the prose never keeps them: a template that knows a
 * marker renders it, and a template that does not yet know it shows nothing
 * rather than a button that lies.
 */
/**
 * Two rules in a row become one.
 *
 * The files divide a page into blocks with "---", and a block between two of
 * them is often a control rather than prose — the two buttons at the foot of
 * Safety and Support, for instance. Take the control out to render it properly
 * and the rules that bracketed it close up against each other, printing an
 * empty band with a line at each edge. One divider is what was meant; two is
 * the seam left by removing what sat between them.
 */
export function collapseRules(body: string): string {
  const out: string[] = [];
  let lastWasRule = false;
  for (const line of body.split("\n")) {
    const isRule = /^[ \t]*-{3,}[ \t]*$/.test(line);
    if (isRule) {
      // A second rule is dropped; the blank line above the first is left
      // alone. "text" then "---" on the next line is a setext heading, so
      // closing that gap turns the line above into an H2.
      if (lastWasRule) continue;
      out.push(line);
      lastWasRule = true;
      continue;
    }
    if (line.trim() !== "") lastWasRule = false;
    out.push(line);
  }
  return out.join("\n");
}

/** The "*[ Optional: write … ]*" box a section offers, if it offers one. */
export function optionalBox(body: string): string | null {
  const m = /(?:^|[^*])\*\[\s*(Optional:[^\]]+?)\s*\]\*/.exec(body);
  return m ? m[1] : null;
}

/** The prose without that marker, which is rendered as the box itself. */
export function withoutOptionalBox(body: string): string {
  return collapseRules(
    body.replace(/^\s*\*\[\s*Optional:[^\]]*\]\*\s*$/gm, "").replace(/\*\[\s*Optional:[^\]]*\]\*/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


/** The "○" questions a check-in asks, in the order the page asks them. */
export function checkinQuestions(body: string): CheckinQuestion[] {
  const out: CheckinQuestion[] = [];
  for (const line of body.split("\n")) {
    const q = /^\*\*(\d+)\.\s*(.+?)\*\*$/.exec(line.trim());
    if (q) {
      out.push({ n: Number(q[1]), prompt: q[2].trim(), options: [] });
      continue;
    }
    const o = /^○\s*(.+)$/.exec(line.trim());
    if (o && out.length) out[out.length - 1].options.push(o[1].trim());
  }
  return out;
}

/** The "### A. …" guidance blocks, one of which is shown. */
export function checkinGuidance(body: string): CheckinGuidance[] {
  const out: CheckinGuidance[] = [];
  let current: CheckinGuidance | null = null;
  for (const line of body.split("\n")) {
    const h = /^###\s+([A-D])\.\s*(.+)$/.exec(line.trim());
    if (h) {
      if (current) out.push(current);
      current = { letter: h[1], title: h[2].trim(), body: "" };
      continue;
    }
    if (current) current.body += line + "\n";
  }
  if (current) out.push(current);
  return out.map((g) => ({ ...g, body: g.body.trim() }));
}

/** The "**[ Card ] …**" blocks a page offers, with the line that explains each. */
export function cardsIn(body: string): PathCard[] {
  const lines = body.split("\n");
  const out: PathCard[] = [];
  lines.forEach((line, i) => {
    const m = /^\*\*\[\s*Card\s*\]\s*(.+?)\s*\*\*$/.exec(line.trim());
    if (m) out.push({ label: m[1], body: (lines[i + 1] ?? "").trim() });
  });
  return out;
}


/**
 * The "☐" lines that are a list to tick, not the page's completion.
 *
 * Lesson 3's note is explicit about these, and Lesson 8's packing list is the
 * same: local, on-page marks that are never saved, submitted, synchronised,
 * analysed or logged, and whose labels may not reach analytics. Nothing about
 * them leaves the browser, so nothing here returns them anywhere but the page.
 */
export function localChecks(body: string): string[] {
  return body
    .split("\n")
    .map((l) => /^\s*☐\s*(.+?)\s*$/.exec(l)?.[1])
    .filter((l): l is string => Boolean(l));
}

export function withoutLocalChecks(body: string): string {
  return collapseRules(body.replace(/^\s*☐\s*.+$/gm, ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * The italic line under a page's title, which the page furniture already says.
 *
 * Every file opens "*Part 1 — Understand Your Need · Lesson 1*", and the label
 * above the title says exactly that, from the page list rather than from the
 * prose. Two of them is the same sentence twice, and the one in the file is
 * the one that can drift out of step with the order the course is actually in.
 */
export function withoutSubtitle(body: string): string {
  return body
    .replace(/^\s*\*(?:Part\s+\d+[^*\n]*|Start Here[^*\n]*|Finish[^*\n]*|Follow-up[^*\n]*)\*\s*$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Lesson 5's seven retreats, as data.
 *
 * Three are written as "[ Card ]" blocks. The other four are a bullet list
 * under "Show other retreat formats", and the note says they are selectable
 * cards too — so they are read from that list in the order it gives, which is
 * the order the codes are named in.
 */
export function planCards(body: string): {
  main: { id: string; label: string; body: string; note?: string }[];
  others: { id: string; label: string; body: string }[];
  othersLabel: string | null;
} {
  const MAIN = ["p3d", "p1d", "p3h"];
  const OTHERS = ["phome", "pcouple", "pgroup", "pleader"];
  const lines = body.split("\n");

  const main: { id: string; label: string; body: string; note?: string }[] = [];
  lines.forEach((line, i) => {
    const m = /^\*\*\[\s*Card\s*\]\s*(.+?)\s*\*\*(?:\s*\*\((.+?)\)\*)?\s*$/.exec(line.trim());
    if (!m || main.length >= MAIN.length) return;
    main.push({
      id: MAIN[main.length],
      label: m[1],
      body: (lines[i + 1] ?? "").trim(),
      note: m[2],
    });
  });

  const at = lines.findIndex((l) => /\*\*\[\s*Show other retreat formats\s*\]\*\*/.test(l));
  const others: { id: string; label: string; body: string }[] = [];
  if (at !== -1) {
    for (let i = at + 1; i < lines.length && others.length < OTHERS.length; i++) {
      const b = /^\s*[*-]\s+(.+?)\s*$/.exec(lines[i]);
      if (b) others.push({ id: OTHERS[others.length], label: b[1], body: "" });
      else if (others.length > 0 && lines[i].trim() !== "") break;
    }
  }

  return {
    main,
    others,
    othersLabel: at === -1 ? null : "Show other retreat formats",
  };
}

/** That whole choice taken out of the prose, because it is rendered as cards. */
export function withoutPlanCards(body: string): string {
  const lines = body.split("\n");
  const drop = new Set<number>();
  lines.forEach((line, i) => {
    if (/^\*\*\[\s*Card\s*\]/.test(line.trim())) {
      drop.add(i);
      drop.add(i + 1);
    }
  });
  const at = lines.findIndex((l) => /\*\*\[\s*Show other retreat formats\s*\]\*\*/.test(l));
  if (at !== -1) {
    drop.add(at);
    let seen = 0;
    for (let i = at + 1; i < lines.length && seen < 4; i++) {
      if (/^\s*[*-]\s+/.test(lines[i])) {
        drop.add(i);
        seen++;
      } else if (seen > 0 && lines[i].trim() !== "") break;
    }
  }
  return collapseRules(lines.filter((_, i) => !drop.has(i)).join("\n"))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * A rule needs a blank line above it.
 *
 * "Some words" on one line and "---" on the next is a setext heading in
 * markdown, not a paragraph and a divider. Taking a control out from between
 * them is enough to put them together, and the quiet line the page ended on
 * came back as a heading twice the size of the text around it.
 */
export function spaceBeforeRules(body: string): string {
  const out: string[] = [];
  for (const line of body.split("\n")) {
    if (/^[ \t]*-{3,}[ \t]*$/.test(line) && out.length && out[out.length - 1].trim() !== "") {
      out.push("");
    }
    out.push(line);
  }
  return out.join("\n");
}

export type Block =
  | { kind: "prose"; text: string }
  | { kind: "plans" }
  | { kind: "box"; label: string }
  | { kind: "checks"; items: string[] }
  | { kind: "step"; label: string };

/**
 * A section as an ordered list of prose and controls.
 *
 * The controls were being appended under the section's prose, which put
 * Lesson 5's retreat cards at the foot of the page instead of under "1. Choose
 * your retreat", and its optional box and completion checkbox below the links
 * they are meant to sit above. A page is a sequence; this keeps it one.
 */
export function blocksOf(body: string, heading = "", withPlans = false): Block[] {
  const lines = body.split("\n");
  const isStep = /take one step/i.test(heading);

  // The completion line is the last "☐" in a step section; every other one is
  // a local tick.
  let stepAt = -1;
  if (isStep) lines.forEach((l, i) => { if (/^\s*☐\s*\S/.test(l)) stepAt = i; });

  const out: Block[] = [];
  let prose: string[] = [];
  const flush = () => {
    const text = spaceBeforeRules(collapseRules(prose.join("\n")))
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text) out.push({ kind: "prose", text });
    prose = [];
  };
  const checks: string[] = [];
  const flushChecks = () => {
    if (checks.length) out.push({ kind: "checks", items: checks.splice(0) });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // The next-step button below already offers this, and two ways on phrased
    // differently is a reader wondering whether they differ.
    // Some carry a trailing note — "**Continue: Session 3 …** *(tomorrow)*" —
    // and that note goes with the line it qualifies.
    if (/^\s*\*\*Continue:[^\n]*\*\*(?:\s*\*\([^)]*\)\*)?\s*$/.test(line)) continue;

    // The line that introduces the formats disclosure is that control's own
    // heading, and the control carries it.
    if (
      /^\s*\*\*Other ways to use this retreat\*\*\s*$/.test(line) &&
      lines.slice(i + 1, i + 4).some((l) => /Show other retreat formats/.test(l))
    ) {
      continue;
    }

    // The retreat choice: the cards, the disclosure and its four formats are
    // one control, emitted where the first card stands.
    if (/^\*\*\[\s*Card\s*\]/.test(line.trim())) {
      // Only where a template knows what the cards are. Welcome Home writes
      // its next pause as cards too, and consuming them here would take them
      // off a page that has nothing ready to render them.
      if (!withPlans) { prose.push(line); continue; }
      flush();
      flushChecks();
      if (!out.some((b) => b.kind === "plans")) out.push({ kind: "plans" });
      i++; // the line under a card belongs to it
      continue;
    }
    if (/\*\*\[\s*Show other retreat formats\s*\]\*\*/.test(line)) {
      let seen = 0;
      while (i + 1 < lines.length && seen < 4) {
        if (/^\s*[*-]\s+/.test(lines[i + 1])) { i++; seen++; }
        else if (seen > 0 && lines[i + 1].trim() !== "") break;
        else if (lines[i + 1].trim() === "") i++;
        else break;
      }
      continue;
    }

    const box = /^\s*\*\[\s*(Optional:[^\]]+?)\s*\]\*\s*$/.exec(line);
    if (box) {
      flush();
      flushChecks();
      out.push({ kind: "box", label: box[1] });
      continue;
    }

    const tick = /^\s*☐\s*(.+?)\s*$/.exec(line);
    if (tick) {
      const plain = tick[1].replace(/^\*\*(.+)\*\*$/, "$1").replace(/^\*(.+)\*$/, "$1");
      if (i === stepAt) {
        flush();
        flushChecks();
        out.push({ kind: "step", label: plain });
      } else {
        flush();
        checks.push(plain);
      }
      continue;
    }

    // A blank line inside a run of ticks keeps them one list.
    if (checks.length && line.trim() === "") continue;
    flushChecks();
    prose.push(line);
  }
  flush();
  flushChecks();
  return out;
}

export function markersIn(body: string): string[] {
  return [...body.matchAll(/\*\*\[\s*([^\]]+?)\s*\]\*\*/g)].map((m) => m[1].trim());
}

export function withoutMarkers(body: string): string {
  return collapseRules(
    body
      .replace(/^\s*\*\*\[[^\]]*\]\*\*\s*$/gm, "")
      .replace(/\*\*\[[^\]]*\]\*\*/g, "")
      .split("\n")
      .filter((l, i, all) => !(l.trim() === "" && all[i - 1]?.trim() === ""))
      .join("\n")
  )
    .replace(/^\s*(?:-{3,}[ \t]*(?:\n|$))+/, "")
    .replace(/(?:(?:^|\n)[ \t]*-{3,}[ \t]*)+$/, "")
    .trim();
}

/**
 * Where Start Here 4's "I understand and want to continue" goes.
 *
 * Start Here 3 stores a code and this is the page that acts on it. r2's own
 * destination is the Quick Start view of My Retreat Plan, which does not exist
 * yet; until it does it goes where r1 and r3 go, which is the first lesson.
 * Nobody is sent to a page that is not there.
 */
export function afterSafety(route: string | null): string {
  if (route === null) return "choose-starting-point";
  return "lesson-01";
}

/** The page's sections, cut at "##", in the order the page puts them. */
export const resetSections = cache(
  (markdown: string): { heading: string; body: string }[] => {
    const out: { heading: string; body: string }[] = [];
    let heading = "";
    let body: string[] = [];
    // A rule that ends a section is the file's own furniture. These pages
    // separate the step from the links beneath it with "---", and sections are
    // cut at "##", so a trailing one is never a divider between two sections —
    // it renders as a rule under nothing.
    const flush = () =>
      out.push({
        heading,
        body: body
          .join("\n")
          .trim()
          .replace(/(?:(?:^|\n)[ \t]*-{3,}[ \t]*)+$/, "")
          .trim(),
      });
    for (const line of markdown.split("\n")) {
      const h2 = /^##\s+(?!#)(.*)$/.exec(line);
      if (h2) {
        flush();
        heading = h2[1].trim();
        body = [];
        continue;
      }
      if (/^#\s+(?!#)/.test(line)) continue; // the page title, shown by the route
      body.push(line);
    }
    flush();
    return out.filter((s) => s.heading || s.body);
  }
);
