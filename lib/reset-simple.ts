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
  /**
   * The session's guided prayer, which is an existing recording under the flat
   * `audio/` folder. The Spiritual Reset's prayers have always lived there and
   * are reused rather than re-recorded; only the sessions have one.
   */
  prayer?: string;
  /**
   * The day introduction video, on the three sessions that open a day of the
   * three-day retreat. An optional link, and only in the full version: its
   * note is explicit that it belongs to that plan and nowhere else.
   */
  video?: string;
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
  { n: 17, slug: "session-01", file: "session-01-come-as-you-are.md", title: "Come As You Are", part: PART.retreat, audio: "15-session-01", length: "about 6 minutes" , deeper: ["13-come-as-you-are"], prayer: "01-come-as-you-are", video: "day-1-introduction" },
  { n: 18, slug: "session-02", file: "session-02-be-still.md", title: "Be Still and Become Present", part: PART.retreat, audio: "16-session-02", length: "about 6 minutes" , deeper: ["14-be-still-and-become-present"], prayer: "02-be-still-and-become-present" },
  { n: 19, slug: "session-03", file: "session-03-put-down-what-you-carry.md", title: "Put Down What You Are Carrying", part: PART.retreat, audio: "17-session-03", length: "about 5 minutes" , deeper: ["15-release-what-you-are-carrying"], prayer: "03-release-what-you-are-carrying", video: "day-2-introduction" },
  { n: 20, slug: "session-04", file: "session-04-honest-prayer.md", title: "Honest Prayer When It Hurts", part: PART.retreat, audio: "18-session-04", length: "about 5 minutes" , deeper: ["16-lament-grief-and-honest-prayer"], prayer: "04-lament-grief-and-honest-prayer" },
  { n: 21, slug: "session-05", file: "session-05-confession-and-grace.md", title: "Confession and Grace", part: PART.retreat, audio: "19-session-05", length: "about 7 minutes" , deeper: ["17-confession-and-grace"], prayer: "05-confession-and-grace" },
  { n: 22, slug: "session-06", file: "session-06-forgiving.md", title: "Forgiving Others and Yourself", part: PART.retreat, audio: "20-session-06", length: "about 8 minutes" , deeper: ["18-forgiving-others-and-yourself"], prayer: "06-forgiving-others-and-yourself" },
  { n: 23, slug: "session-07", file: "session-07-listening.md", title: "Listening for God's Direction", part: PART.retreat, audio: "21-session-07", length: "about 8 minutes" , deeper: ["19-listening-for-god-s-direction"], prayer: "07-listening-for-gods-direction", video: "day-3-introduction" },
  { n: 24, slug: "session-08", file: "session-08-remember-who-you-are.md", title: "Remember Who You Are", part: PART.retreat, audio: "22-session-08", length: "about 6 minutes" , deeper: ["20-rediscovering-your-identity"], prayer: "08-rediscovering-your-identity" },
  { n: 25, slug: "session-09", file: "session-09-renewing-your-purpose.md", title: "Renewing Your Purpose", part: PART.retreat, audio: "23-session-09", length: "about 7 minutes" , deeper: ["21-renewing-your-purpose"], prayer: "09-renewing-your-purpose" },
  { n: 26, slug: "session-10", file: "session-10-going-home.md", title: "Going Home With a New Rhythm", part: PART.retreat, audio: "24-session-10", length: "about 6 minutes" , deeper: ["22-returning-with-a-new-rhythm"], prayer: "10-returning-with-a-new-rhythm" },

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
    // Notes to whoever builds the page, written in italics rather than inside
    // the implementation comment, so nothing was stripping them.
    //
    // Matched on what they have in common rather than phrase by phrase. Every
    // one of them either speaks about "the learner" in the third person, or
    // announces how many versions the file holds, or instructs whoever is
    // building what to show. The course itself never does any of that: it
    // addresses the reader as "you" throughout. Chasing the wording instead
    // meant fixing four and leaving "This is a flex session. It has one
    // version." on two more.
    .replace(/^\s*\*[^*\n]*\bthe learner\b[^*\n]*\*\s*$/gim, "")
    .replace(/^\s*\*[^*\n]*\bit has one version\b[^*\n]*\*\s*$/gim, "")
    .replace(/^\s*\*(?:Do not show|Show only)[^*\n]*\*\s*$/gim, "")
    // The day introduction is offered as a real link where the video is, so
    // the italic line describing it would be the same offer twice.
    .replace(/^\s*\*Optional: Watch [^*\n]*introduction\.?\*\s*$/gm, "")
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
  | { kind: "step"; label: string }
  | { kind: "timer"; minutes: number[] }
  | { kind: "skip"; label: string };

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
  const isStep =
    /take one step/i.test(heading) || /VERSION/i.test(heading) || heading === "";

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
      // Welcome Home's next pause is four cards that are chosen on the page
      // and nowhere else: its note forbids saving, sending or scheduling
      // anything from them, so they become local ticks rather than a control
      // that writes. Lesson 5's are the plans, which do write a code.
      if (!withPlans) {
        const label = /^\*\*\[\s*Card\s*\]\s*(.+?)\s*\*\*$/.exec(line.trim())?.[1];
        if (label) {
          flush();
          checks.push(label);
          continue;
        }
        prose.push(line);
        continue;
      }
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

    const timer = /^\s*\*\*\[\s*Timer:([^\]]+?)\]\*\*\s*$/.exec(line);
    if (timer) {
      const mins = [...timer[1].matchAll(/\d+/g)].map((x) => Number(x[0]));
      if (mins.length) {
        flush();
        flushChecks();
        out.push({ kind: "timer", minutes: mins });
        continue;
      }
    }

    // A way past something, offered where the page offers it. Session 4's
    // "Skip this session for now" stands before the listening, which is where
    // somebody deciding whether to do the session at all needs it — not at the
    // foot of a session they have already been through.
    const skip = /^\s*\*\*\[\s*((?:Skip|Leave this for later)[^\]]*?)\s*\]\*\*\s*$/.exec(line);
    if (skip) {
      flush();
      flushChecks();
      out.push({ kind: "skip", label: skip[1] });
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

/**
 * Which of My Retreat Plan's views a learner sees.
 *
 * One view, never more. The page carries five — three lengths, a Quick Start
 * and the specialist formats — and showing two would be showing somebody a
 * retreat they did not choose.
 *
 * Quick Start stands in for the ordinary three-hour view when the starting
 * point was "I need a short pause soon". Its note is specific: route r2, and
 * a plan that is either three hours or not yet chosen.
 */
export function planViewFor(
  plan: string | null,
  route: string | null
): { heading: RegExp; kind: "plan" | "quickstart" | "other" | "none" } {
  if (route === "r2" && (plan === null || plan === "p3h")) {
    return { heading: /^QUICK START VIEW/i, kind: "quickstart" };
  }
  if (plan === "p3d") return { heading: /^PLAN VIEW: THREE-DAY/i, kind: "plan" };
  if (plan === "p1d") return { heading: /^PLAN VIEW: ONE-DAY/i, kind: "plan" };
  if (plan === "p3h") return { heading: /^PLAN VIEW: THREE-HOUR/i, kind: "plan" };
  if (plan) return { heading: /^OTHER RETREAT FORMATS/i, kind: "other" };
  return { heading: /$^/, kind: "none" };
}

/** The existing programme page a specialist plan opens. */
export const PROGRAMME_PAGE: Record<string, string> = {
  phome: "34-the-at-home-retreat",
  pcouple: "35-the-retreat-for-couples",
  pgroup: "36-the-small-group-and-church-retreat",
  pleader: "37-the-retreat-for-pastors-and-christian-leaders",
};

/**
 * "Session 3 — Put Down What You Are Carrying" turned into a link.
 *
 * The title is matched against the page list, not guessed at with a pattern.
 * A greedy match ran past the end of the name and swallowed whatever followed
 * it: "Session 5 — Confession and Grace only if you feel rested" became the
 * link text, "Session 6 — Forgiving Others and Yourself (optional" took the
 * bracket with it, and trimming the result closed the gap before the word
 * after it — "Remember Who You Are **or**" came out as "Areor".
 *
 * So the title is consumed only when it is exactly the session's own, and
 * "Session 5" on its own is linked as just those two words.
 */
export function linkSessions(body: string, href: (slug: string) => string): string {
  const titleOf = (n: string) =>
    RESET_SIMPLE_PAGES.find((p) => p.slug === `session-${n.padStart(2, "0")}`);

  return body
    .split("\n")
    .map((line) => {
      if (/^\s{0,3}#/.test(line)) return line;
      if (/\]\(/.test(line)) return line; // already carries a link
      // "**[ Begin Session 1 ]**" and "**[ Skip Session 7 and rest ]**" are
      // controls. They are rendered as buttons elsewhere and linking inside
      // one would nest a link in a marker.
      if (/\*\*\[/.test(line)) return line;

      let out = "";
      let i = 0;
      const re = /\bSession (\d{1,2})\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        const page = titleOf(m[1]);
        if (!page) continue;

        // The name only counts when the dash and the title follow exactly.
        const after = line.slice(m.index + m[0].length);
        const dash = /^(\s*[—–-]\s*)/.exec(after);
        const title = page.title;
        const hasTitle =
          dash !== null &&
          after.slice(dash[1].length, dash[1].length + title.length).toLowerCase() ===
            title.toLowerCase();

        const text = hasTitle ? `${m[0]}${dash![1]}${title}` : m[0];
        out += line.slice(i, m.index) + `[${text}](${href(page.slug)})`;
        i = m.index + text.length;
        re.lastIndex = i;
      }
      return out + line.slice(i);
    })
    .join("\n");
}

/**
 * Which sessions each retreat includes, as the plan views time them.
 *
 * The three-day retreat takes all ten. The one-day retreat takes five, and the
 * three-hour reset four — and the sessions they leave out are the ones that go
 * into grief, confession, forgiveness, identity and purpose. That is not an
 * accident of length: the three-hour view says so in its own words, that it
 * "does not include lament, confession, forgiveness, identity, purpose or long
 * listening".
 *
 * So a learner on a shorter plan is not shown a session their retreat does not
 * contain. It is not hidden from them either — they are told it belongs to a
 * longer retreat, and how to get to one.
 */
export const SESSION_PLANS: Record<string, string[]> = {
  "session-01": ["p3d", "p1d", "p3h"],
  "session-02": ["p3d", "p1d", "p3h"],
  "session-03": ["p3d", "p1d", "p3h"],
  "session-04": ["p3d"],
  "session-05": ["p3d"],
  "session-06": ["p3d"],
  "session-07": ["p3d", "p1d"],
  "session-08": ["p3d"],
  "session-09": ["p3d"],
  "session-10": ["p3d", "p1d", "p3h"],
};

/**
 * Whether this session belongs to the retreat the learner is on.
 *
 * A plan that is not one of the three lengths — a specialist format, or none
 * chosen yet — sees everything: those retreats are run from their own
 * programme pages, and somebody simply reading ahead should not be turned
 * away from a page.
 */
export function sessionInPlan(slug: string, plan: string | null): boolean {
  const plans = SESSION_PLANS[slug];
  if (!plans) return true;
  if (plan === null || !["p3d", "p1d", "p3h"].includes(plan)) return true;
  return plans.includes(plan);
}

/**
 * What each route asks a learner to finish, for Welcome Home's acknowledgement.
 *
 * The full-course rule is the note's own, word for word: Parts 1 and 2, the
 * three-day retreat's core sessions, Session 10, and the five Bring It Home
 * lessons. Sessions 6, 8 and 9 are not required, and neither is the Day 30
 * Review — it is a follow-up a month later, and finishing must not wait on it.
 *
 * The two shorter routes are not stated in one place, so they are written out
 * here to be argued with. The one-day retreat times Sessions 1, 2, 3, 7 and
 * 10, and its note says Session 7 may be skipped, so it is not required; the
 * preparation lessons are, because a one-day learner comes through them.
 *
 * The three-hour reset asks for neither. It is reached from Quick Start by
 * somebody who said they need a short pause soon, and that view exists to let
 * them begin without working through eleven preparation pages first. Requiring
 * those pages before telling them they had completed a three-hour reset would
 * withhold the acknowledgement for work that route never asked of them. So it
 * needs its four sessions and the four Bring It Home lessons — not Lesson 20,
 * which Lesson 21's note says that route reaches it without.
 */
const PART_1_AND_2 = [
  "lesson-01",
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "checkin-01",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
  "lesson-09",
  "checkin-02",
];

const BRING_IT_HOME = ["lesson-20", "lesson-21", "lesson-22", "lesson-23", "lesson-24"];

export const ROUTE_REQUIRES: Record<string, { sessions: string[]; pages: string[] }> = {
  p3d: {
    sessions: ["session-01", "session-02", "session-03", "session-04", "session-05", "session-07", "session-10"],
    pages: [...PART_1_AND_2, ...BRING_IT_HOME],
  },
  p1d: {
    sessions: ["session-01", "session-02", "session-03", "session-10"],
    pages: [...PART_1_AND_2, ...BRING_IT_HOME],
  },
  p3h: {
    sessions: ["session-01", "session-02", "session-03", "session-10"],
    pages: BRING_IT_HOME.filter((p) => p !== "lesson-20"),
  },
};

/**
 * Whether the learner has finished their route, and what is next if not.
 *
 * A specialist format is measured against the full course, which its note
 * requires: those retreats are run from their own programme pages, so there is
 * no shorter route to acknowledge.
 *
 * Nothing here is a gate. A learner who has not finished still reaches this
 * page and is told so gently, with the next thing named.
 */
export function routeFinished(
  plan: string | null,
  isDone: (slug: string) => boolean
): { finished: boolean; kind: "full" | "oneday" | "threehour"; next: string | null } {
  const kind = plan === "p1d" ? "oneday" : plan === "p3h" ? "threehour" : "full";
  const spec = ROUTE_REQUIRES[plan ?? "p3d"] ?? ROUTE_REQUIRES.p3d;
  const planFor = plan ?? "p3d";

  for (const slug of spec.pages) {
    if (!isDone(slug)) return { finished: false, kind, next: slug };
  }
  for (const slug of spec.sessions) {
    if (!isDone(sessionProgressSlug(slug, planFor))) {
      return { finished: false, kind, next: slug };
    }
  }
  return { finished: true, kind, next: null };
}

/**
 * How far along a learner is, measured against their own route.
 *
 * Not against the course. The three retreats ask for different pages — the
 * three-hour reset asks for eight, the full course twenty-three — and a
 * learner on the short one is not two-thirds behind. Counting everybody
 * against the longest would invent a target the course refuses to set, and do
 * it on the members page before they have chosen anything.
 *
 * The Day 30 Review is outside it, being a follow-up a month later, and so are
 * the Start Here pages: nothing in them is finished, they are read.
 */
export function resetRouteProgress(
  plan: string | null,
  isDone: (slug: string) => boolean
): { done: number; total: number } {
  const spec = ROUTE_REQUIRES[plan ?? "p3d"] ?? ROUTE_REQUIRES.p3d;
  const planFor = plan ?? "p3d";
  const slugs = [
    ...spec.pages,
    ...spec.sessions.map((s) => sessionProgressSlug(s, planFor)),
  ];
  return { done: slugs.filter(isDone).length, total: slugs.length };
}

/** The pages of one part, for the course home's list. */
export function pagesInPart(part: ResetPart): ResetSimplePage[] {
  return RESET_SIMPLE_PAGES.filter((p) => p.part === part);
}

/** Every part, in the order a learner meets them. */
export function resetParts(): ResetPart[] {
  const seen: ResetPart[] = [];
  for (const p of RESET_SIMPLE_PAGES) if (!seen.includes(p.part)) seen.push(p.part);
  return seen;
}

/** Which version of a session a plan code opens. */
export function sessionVersionFor(plan: string | null): RegExp {
  if (plan === "p1d") return /^ONE-DAY VERSION/i;
  if (plan === "p3h") return /^THREE-HOUR VERSION/i;
  // The three-day retreat is the full one, and it is what a specialist format
  // or an unchosen plan sees: it is the version the others are cut down from.
  return /^FULL VERSION/i;
}

/**
 * A session's progress slug, which carries the route it was finished on.
 *
 * Its note is explicit: finishing the three-hour version does not mark the
 * full version done. They are different lengths of the same session and a
 * learner who later takes the full retreat has not already done it.
 */
export function sessionProgressSlug(slug: string, plan: string | null): string {
  return plan ? `${slug}-${plan}` : slug;
}

/** The minutes a "[ Timer: 5 · 10 · 20 · 30 minutes ]" marker offers. */
export function timerMinutes(body: string): number[] | null {
  const m = /\*\*\[\s*Timer:([^\]]+?)\]\*\*/.exec(body);
  if (!m) return null;
  const mins = [...m[1].matchAll(/\d+/g)].map((x) => Number(x[0]));
  return mins.length ? mins : null;
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
