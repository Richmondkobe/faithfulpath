import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

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

export const MIND_COURSE_SLUG = "when-your-mind-wont-rest";

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

/** A content file's front matter and body, read by its manifest-relative path. */
export const readPageFile = cache((file: string): PageFile | null => {
  const path = join(ROOT, file);
  if (!existsSync(path)) return null;

  const raw = readFileSync(path, "utf8");
  const block = raw.match(FRONT_MATTER)?.[1] ?? "";
  const [front] = parseYamlBlock(block.split(/\r?\n/), 0, 0);

  return {
    front: (front ?? {}) as Record<string, YamlValue>,
    body: raw.replace(FRONT_MATTER, "").trim(),
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
