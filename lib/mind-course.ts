import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { MIND_COURSE_SLUG } from "@/lib/mind-links";

// Reader for "When Your Mind Won't Rest".
//
// It gets its own module rather than extending lib/course.ts because the two
// manifests are different shapes — the Spiritual Reset has modules[].lessons[],
// this has modules[].pages[] plus checkins, a resources registry, a journey and
// a leaders' section. Keeping them apart is what lets the Spiritual Reset carry
// on unchanged.
//
// course.json is the contract. Anything the platform needs to know about
// ordering, gating, statuses or resources is read from there, never inferred
// from the directory listing.

export { MIND_COURSE_SLUG } from "@/lib/mind-links";

const ROOT = join(process.cwd(), "content", "courses", MIND_COURSE_SLUG);

/* ------------------------------------------------------------- manifest */

export type EntryPoint = {
  id: string;
  label: string;
  blurb: string;
  opens: string;
  persistent_button_on_every_page?: boolean;
  never_locked?: boolean;
  locked?: boolean;
};

export type MindPage = {
  file: string;
  order?: number;
  title: string;
  type?: string;
  slug?: string;
  chapter?: number;
  key_scripture?: string;
  worksheet?: string | null;
  finish_label?: string;
  resources?: string[];
  /** Journey days only. */
  day?: number;
  week?: string;
  week_title?: string;
  label?: string;
};

export type MindCheckin = {
  file: string;
  title: string;
  type: "pause" | "pattern_finder";
  scored: boolean;
  required: boolean;
  private: boolean;
  gates_completion: boolean;
  affects_certificate: boolean;
  rules?: Record<string, unknown>;
  patterns?: { id: string; text: string; lesson: number }[];
};

export type MindModule = {
  id: string;
  title: string;
  outcome: string;
  counts_towards_completion: boolean;
  pages: MindPage[];
  checkins?: MindCheckin[];
  home?: string;
  first_entry_notice?: Record<string, unknown>;
  status_config?: StatusConfig;
};

export type StatusConfig = {
  options: string[];
  progress_wording: string;
  visit_counts_on_open: boolean;
  opening_marks_complete: boolean;
  status_changeable: boolean;
  status_clearable: boolean;
  not_appropriate_counts_as_responded: boolean;
  need_support_marks_complete: boolean;
  need_support_opens: string;
  need_support_sends_notification: boolean;
  skip_for_now_style: string;
  no_streaks: boolean;
  no_overdue: boolean;
  no_catch_up: boolean;
  no_emotional_scoring: boolean;
  any_day_openable_without_calendar_date: boolean;
  progress_stored_separately_from_foundation: boolean;
};

export type MindResource = {
  file: string;
  title: string;
  toolkit_number: number;
  printable: boolean;
  group_sharing: boolean;
  not_for_group_sharing: boolean;
  group_sharing_note: string | null;
  private: boolean;
  safety_box_required_before_prompts: boolean;
  optional: boolean;
  never_prompt_repeat: boolean;
  counts_towards_completion: boolean;
};

export type MindManifest = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  course_map_version: string;
  promise: string;
  promise_excludes: string[];
  scripture: { translation: string; notice: string; notice_required_on: string[] };
  entry_points: EntryPoint[];
  course_home_links: {
    id: string;
    label: string;
    blurb: string;
    opens: string;
    member_gated?: boolean;
  }[];
  footer_links: { label: string; opens: string }[];
  no_prerequisite_locks: boolean;
  lesson_rules: {
    next_faithful_step: { options: string[]; private: boolean; optional: boolean };
    completion: { button_label: string; never_depends_on: string[] };
    complete_chapter: Record<string, unknown>;
    journal_reflection: Record<string, unknown>;
  };
  modules: MindModule[];
  resources: MindResource[];
  leaders_section: Record<string, unknown>;
  downloads: { id?: string; file: string; title?: string; label?: string }[];
  completion: Record<string, unknown>;
  privacy: Record<string, unknown>;
  audio?: Record<string, unknown>;
};

export const getMindCourse = cache((): MindManifest => {
  return JSON.parse(readFileSync(join(ROOT, "course.json"), "utf8")) as MindManifest;
});

/* ------------------------------------------------ front matter (nested) */

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

type YamlValue = string | number | boolean | null | YamlValue[] | { [k: string]: YamlValue };

/**
 * Enough YAML for this content, and no more: scalars, nested maps, inline
 * lists, list-of-scalars and list-of-maps, all two-space indented. That covers
 * the `choice`, `intention`, `acknowledgement` and `entries` blocks the Start
 * Here pages use, which the flat parser in lib/course.ts cannot read.
 *
 * Anything it does not recognise is skipped rather than guessed at, so a new
 * shape shows up as missing instead of as something subtly wrong.
 */
function parseYamlBlock(lines: string[], indent: number, start: number): [YamlValue, number] {
  // A list at this indent.
  if (lines[start]?.slice(indent).startsWith("- ")) {
    const items: YamlValue[] = [];
    let i = start;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const ind = line.search(/\S/);
      if (ind < indent || !line.slice(indent).startsWith("- ")) break;

      const rest = line.slice(indent + 2);
      const keyed = rest.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);

      if (keyed) {
        // A list of maps: the first pair sits on the dash line, the rest follow
        // indented beneath it.
        const map: Record<string, YamlValue> = {};
        map[keyed[1]] = scalar(keyed[2]);
        i++;
        const childIndent = indent + 2;
        while (i < lines.length) {
          const l = lines[i];
          if (!l.trim()) { i++; continue; }
          const ind2 = l.search(/\S/);
          if (ind2 < childIndent || l.slice(indent).startsWith("- ")) break;
          const m = l.slice(childIndent).match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
          if (!m) { i++; continue; }
          if (m[2].trim() === "") {
            const [value, next] = parseYamlBlock(lines, childIndent + 2, i + 1);
            map[m[1]] = value;
            i = next;
          } else {
            map[m[1]] = scalar(m[2]);
            i++;
          }
        }
        items.push(map);
      } else {
        items.push(scalar(rest));
        i++;
      }
    }
    return [items, i];
  }

  // A map at this indent.
  const map: Record<string, YamlValue> = {};
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const ind = line.search(/\S/);
    if (ind < indent) break;

    const m = line.slice(indent).match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) { i++; continue; }

    if (m[2].trim() === "") {
      const [value, next] = parseYamlBlock(lines, indent + 2, i + 1);
      map[m[1]] = value;
      i = next;
    } else {
      map[m[1]] = scalar(m[2]);
      i++;
    }
  }
  return [map, i];
}

function scalar(raw: string): YamlValue {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "") return null;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  if (/^-?\d+$/.test(v)) return Number(v);
  return v.replace(/^["']|["']$/g, "");
}

export type PageFile = {
  front: Record<string, YamlValue>;
  body: string;
};

/**
 * Lines written to the person building the course, not to the member reading
 * it — "Displayed before Day 1 can open on a member's first entry…" and the
 * like. They describe what the platform should do, and they were rendering on
 * the page underneath the thing they describe.
 *
 * Stripped at render rather than deleted from the files, because the content is
 * authored elsewhere and may be regenerated; a deletion here would be undone by
 * the next export, and this cannot be.
 *
 * Matched in full and scoped to one file each, deliberately. Every one of these
 * is an italic single-line paragraph, and so are several lines of real guidance
 * — the Week Four note on the journey home tells a member about an optional
 * exercise and is exactly the same shape. Anything looser than an exact match
 * would take that with it. verify:mind asserts each one still matches, so a
 * reworded note shows up as a failure rather than quietly reappearing.
 */
const AUTHOR_NOTES: Record<string, string[]> = {
  "m0/lessons/07-my-mind-is-restless-right-now.md": [
    "*The list below is generated from the `entries` above; it is reproduced here only so the page can be read as plain Markdown.*",
  ],
  "m5/00-journey-home.md": [
    "*Displayed before Day 1 can open on a member's first entry, with a single **Continue to Day 1** button. No agreement, checkbox or personal response is required, and the support pages and course home remain open. The notice stays accessible from the journey home afterwards.*",
  ],
  "m2/checkins/m2-pattern-finder.md": [
    '*After you choose: "These lessons may be helpful." The suggested lessons appear as links; the module itself stays in its normal order.*',
  ],
};

/**
 * Pages the content names in prose but never links to.
 *
 * The course text says "Open Finding Help Where You Live" and leaves it as
 * words — there is not one Markdown link in the whole of the content. Between
 * them these two pages are named 111 times, and they are the two a member in
 * difficulty is being sent to, so leaving them unclickable is the worst place
 * to make someone hunt through a menu.
 *
 * Linked at render, by exact title. The titles are distinctive multi-word
 * phrases, so there is nothing else they could match by accident.
 */
const LINKED_PAGES: { title: string; file: string }[] = [
  { title: "Finding Help Where You Live", file: "m0/lessons/06-finding-help-where-you-live.md" },
  { title: "When This Course Is Not Enough", file: "m0/lessons/04-when-this-course-is-not-enough.md" },
  { title: "My Mind Is Restless Right Now", file: "m0/lessons/07-my-mind-is-restless-right-now.md" },
];

export function linkedPageTitles(): { title: string; file: string }[] {
  return LINKED_PAGES;
}

const COURSE_BASE = "/members/courses/when-your-mind-wont-rest";

/**
 * Turns those page names into links.
 *
 * Headings are left alone — a linked heading on the page's own title reads as
 * a mistake — and so is any name on the page it refers to, which would
 * otherwise link to itself. An occurrence already inside a link is skipped, so
 * running this twice changes nothing.
 */
export function linkCourseReferences(body: string, selfFile?: string): string {
  const lines = body.split(/\r?\n/);

  return lines
    .map((line) => {
      // Headings, code fences and indented code stay as they are.
      if (/^\s{0,3}#/.test(line) || /^\s*```/.test(line) || /^\s{4,}\S/.test(line)) {
        return line;
      }

      let out = line;
      for (const page of LINKED_PAGES) {
        if (page.file === selfFile) continue;
        const slug = page.file.split("/").pop()!.replace(/\.md$/, "");
        const href = `${COURSE_BASE}/lessons/${slug}`;

        // Skip an occurrence that is already the text of a link.
        const pattern = new RegExp(`(?<!\\[)\\b${page.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b(?!\\])`, "g");
        out = out.replace(pattern, `[${page.title}](${href})`);
      }
      return out;
    })
    .join("\n");
}

/**
 * The restless-now page's Markdown list.
 *
 * The visible list is generated from the `entries` front matter, and this one
 * is the plain-Markdown fallback the build checks it against — so on the page
 * it was rendering as a second, unclickable copy directly above the real one.
 */
function stripFallbackList(file: string, body: string): string {
  if (file !== "m0/lessons/07-my-mind-is-restless-right-now.md") return body;

  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((l) => /^[-*]\s+\*\*/.test(l));
  if (start === -1) return body;

  let end = start;
  while (end < lines.length && (/^[-*]\s+/.test(lines[end]) || !lines[end].trim())) end++;

  return [...lines.slice(0, start), ...lines.slice(end)]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The notes this file carries, for the build assertion to check against. */
export function authorNotesFor(file: string): string[] {
  return AUTHOR_NOTES[file] ?? [];
}

function stripAuthorNotes(file: string, body: string): string {
  const notes = AUTHOR_NOTES[file];
  if (!notes) return body;

  const lines = body.split(/\r?\n/).filter((line) => !notes.includes(line.trim()));
  // A stripped line leaves its blank line behind; collapse the gap so the
  // paragraphs either side sit as though it had never been there.
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** A content file's front matter and body, read by its manifest-relative path. */
export const readPageFile = cache((file: string): PageFile | null => {
  const path = join(ROOT, file);
  if (!existsSync(path)) return null;

  const raw = readFileSync(path, "utf8");
  const block = raw.match(FRONT_MATTER)?.[1] ?? "";
  const [front] = parseYamlBlock(block.split(/\r?\n/), 0, 0);

  return {
    front: (front ?? {}) as Record<string, YamlValue>,
    // All three happen here rather than in each route, so no render path can
    // miss them: the author notes go, the restless-now fallback list goes, and
    // the two safety pages become links wherever they are named.
    body: linkCourseReferences(
      stripFallbackList(file, stripAuthorNotes(file, raw.replace(FRONT_MATTER, "").trim())),
      file
    ),
  };
});

/* ------------------------------------------------------------- lookups */

/** Every foundation page: Start Here plus modules 1-4, in manifest order. */
export const getFoundationPages = cache((): { module: MindModule; page: MindPage }[] => {
  const out: { module: MindModule; page: MindPage }[] = [];
  for (const mod of getMindCourse().modules) {
    if (mod.id === "m5") continue;
    for (const page of mod.pages) out.push({ module: mod, page });
  }
  return out;
});

/** The 21 lessons the certificate counts — modules 1 to 4, Start Here excluded. */
export const getCountingLessons = cache((): MindPage[] =>
  getMindCourse()
    .modules.filter((m) => m.counts_towards_completion)
    .flatMap((m) => m.pages)
);

export const findPageBySlug = cache(
  (slug: string): { module: MindModule; page: MindPage } | null =>
    getFoundationPages().find((p) => pageSlug(p.page) === slug) ?? null
);

/** A page's URL segment: its manifest slug, or the filename without extension. */
export function pageSlug(page: MindPage): string {
  return page.slug ?? page.file.split("/").pop()!.replace(/\.md$/, "");
}

export const getJourneyModule = cache((): MindModule =>
  getMindCourse().modules.find((m) => m.id === "m5")!
);

export const findDay = cache((day: number): MindPage | null =>
  getJourneyModule().pages.find((p) => p.day === day) ?? null
);

export const getCheckins = cache((): MindCheckin[] =>
  getMindCourse().modules.flatMap((m) => m.checkins ?? [])
);

export const findCheckin = cache(
  (slug: string): MindCheckin | null =>
    getCheckins().find((c) => checkinSlug(c) === slug) ?? null
);

export function checkinSlug(checkin: MindCheckin): string {
  return checkin.file.split("/").pop()!.replace(/\.md$/, "");
}

/* ----------------------------------------------------------- resources */

/**
 * Resolve `resources/[filename].md` against the manifest's registry.
 *
 * Page front matter names a worksheet by bare filename; the real file lives
 * under whichever module owns it, which is not necessarily the module of the
 * page pointing at it. The manifest says so explicitly at
 * `resource_path_resolution`, so this resolves by filename against the registry
 * and never relative to the lesson's own directory.
 */
export const findResource = cache((ref: string): MindResource | null => {
  const filename = ref.split("/").pop();
  if (!filename) return null;
  return (
    getMindCourse().resources.find((r) => r.file.split("/").pop() === filename) ?? null
  );
});

/** A worksheet's URL segment: its filename, which is unique across modules. */
export function resourceSlug(resource: MindResource): string {
  return resource.file.split("/").pop()!.replace(/\.md$/, "");
}

export const findResourceBySlug = cache((slug: string): MindResource | null =>
  getMindCourse().resources.find((r) => resourceSlug(r) === slug) ?? null
);

/* ------------------------------------------------------- chapter split */

export type LessonBody = {
  /** Everything before "Read the complete chapter". */
  main: string;
  /** The chapter, or null when the lesson has none. */
  chapter: string | null;
};

const CHAPTER_HEADING = /^##\s+Read the complete chapter\s*$/im;

/**
 * Splits the chapter out of a lesson body so the page can put it in one
 * collapsed disclosure.
 *
 * The source carries no raw HTML — react-markdown does not render it — so the
 * disclosure is built at render time. Everything from the heading to the next
 * H2 belongs to the chapter; the H3s and H4s inside it stay as headings, which
 * is what keeps them visible and anchored once opened.
 */
export function splitChapter(body: string): LessonBody {
  const match = body.match(CHAPTER_HEADING);
  if (match?.index === undefined) return { main: body, chapter: null };

  const after = body.slice(match.index + match[0].length);
  // The next H2 ends the chapter. H3 and H4 are the chapter's own headings.
  const next = after.search(/^##\s+(?!#)/m);

  const chapter = (next === -1 ? after : after.slice(0, next)).trim();
  const rest = next === -1 ? "" : after.slice(next);

  return {
    main: (body.slice(0, match.index) + "\n\n" + rest).trim(),
    chapter: chapter || null,
  };
}

/* -------------------------------------------------------- safety boxes */

/** The first prompt in a worksheet — "Step 1.", "1." or a bolded step. */
const FIRST_PROMPT = /^(Step\s*\d|\d+\.|\*\*Step)/m;
/** A Markdown blockquote, which is how every safety box is written. */
const BLOCKQUOTE = /^>\s+\S/m;

/**
 * Whether a worksheet's safety box actually sits above its prompts.
 *
 * Some exercises must never be shown without their box — testing a prediction
 * against the evidence is the wrong thing to do to a real danger, and the box
 * is what says so. The manifest flags those with
 * safety_box_required_before_prompts, but a flag is a claim about the file, not
 * a property of it: this checks the file itself, so a box deleted in an edit
 * stops the exercise rendering rather than quietly going missing.
 */
export function hasSafetyBoxBeforePrompts(body: string): boolean {
  const box = body.match(BLOCKQUOTE);
  if (!box?.index && box?.index !== 0) return false;

  const prompt = body.match(FIRST_PROMPT);
  if (prompt?.index === undefined) return true;

  return box.index < prompt.index;
}

/* ------------------------------------------------------------ check-ins */

export type PauseBody = {
  /** Prose before the questions. */
  before: string;
  /** The numbered questions, in order. */
  questions: string[];
  /** Prose after them. */
  after: string;
};

/**
 * Lifts a module pause's numbered questions out of its body.
 *
 * The questions live in the Markdown as an ordered list, and the page needs
 * them as labels so each can be answered in place. Splitting rather than
 * duplicating is what keeps every question on the page exactly once.
 *
 * A pause with no list comes back with an empty `questions` and its whole body
 * in `before`, so it still renders as a page to read.
 */
export function splitPauseQuestions(body: string): PauseBody {
  const lines = body.split(/\r?\n/);
  const first = lines.findIndex((l) => /^\d+\.\s+\S/.test(l));
  if (first === -1) return { before: body, questions: [], after: "" };

  let last = first;
  const questions: string[] = [];
  for (let i = first; i < lines.length; i++) {
    const match = lines[i].match(/^\d+\.\s+(.*)$/);
    if (match) {
      questions.push(match[1].trim());
      last = i;
      continue;
    }
    if (lines[i].trim() === "") continue;
    break;
  }

  return {
    before: lines.slice(0, first).join("\n").trim(),
    questions,
    after: lines.slice(last + 1).join("\n").trim(),
  };
}

/* -------------------------------------------------------------- leaders */

export type LeadersSection = {
  gate: string;
  pages: string[];
  downloads: string[];
  downloads_require_acknowledgement: string;
};

export const getLeadersSection = cache((): LeadersSection => {
  return getMindCourse().leaders_section as unknown as LeadersSection;
});

/** A leaders' page by its filename slug, or null. */
export const findLeadersPage = cache((slug: string): string | null =>
  getLeadersSection().pages.find(
    (f) => f.split("/").pop()!.replace(/\.md$/, "") === slug
  ) ?? null
);

/** A leaders' download by its filename slug, or null. */
export const findLeadersDownload = cache((slug: string): string | null =>
  getLeadersSection().downloads.find(
    (f) => f.split("/").pop()!.replace(/\.(md|pdf)$/, "") === slug
  ) ?? null
);

/** The absolute path of a file inside this course's content folder. */
export function coursePath(file: string): string {
  return join(ROOT, file);
}

/** The toolkit and any other member download named in the manifest. */
export const findDownload = cache((slug: string) =>
  getMindCourse().downloads.find(
    (d) => d.file.split("/").pop()!.replace(/\.pdf$/, "") === slug
  ) ?? null
);

/* ---------------------------------------------------------------- audio */

export type MindAudio = { id: string; page?: string; pages?: string[] };

/** The recordings that exist at launch, from the manifest's audio.launch. */
export const getLaunchAudio = cache((): MindAudio[] => {
  const audio = getMindCourse().audio as { launch?: MindAudio[] } | undefined;
  return audio?.launch ?? [];
});

/** Which pages a recording belongs to — one page, or several. */
export function audioPages(entry: MindAudio): string[] {
  return entry.pages ?? (entry.page ? [entry.page] : []);
}

/* -------------------------------------------------------------- journey */

/**
 * Splits the leading blockquote off a page body.
 *
 * The journey home opens with the "Please read before Day 1" notice, which has
 * to be shown on its own on a member's first entry and stay reachable
 * afterwards. Taking it from the file rather than restating it here means the
 * notice a member reads is the one the author wrote.
 */
export function splitFirstNotice(body: string): { notice: string | null; rest: string } {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trimStart().startsWith(">"));
  if (start === -1) return { notice: null, rest: body };

  let end = start;
  while (end < lines.length && (lines[end].trimStart().startsWith(">") || !lines[end].trim())) {
    if (lines[end].trimStart().startsWith(">")) end++;
    else if (lines[end + 1]?.trimStart().startsWith(">")) end++;
    else break;
  }

  return {
    notice: lines.slice(start, end).join("\n").trim() || null,
    rest: [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim(),
  };
}

/** The journey's days, grouped by week in manifest order. */
export const getJourneyWeeks = cache((): { week: string; title: string; days: MindPage[] }[] => {
  const weeks: { week: string; title: string; days: MindPage[] }[] = [];
  for (const day of getJourneyModule().pages) {
    const key = day.week ?? "w1";
    let group = weeks.find((w) => w.week === key);
    if (!group) {
      group = { week: key, title: day.week_title ?? key, days: [] };
      weeks.push(group);
    }
    group.days.push(day);
  }
  return weeks;
});
