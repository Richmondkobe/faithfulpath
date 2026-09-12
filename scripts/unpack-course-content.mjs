#!/usr/bin/env node
//
// Unpacks the newest course-content export into content/courses/.
//
// Every content drop so far has arrived as a zip in ~/Downloads or a folder on
// the Desktop, and been described as "already in the repo" when it was not.
// This finds the newest one, checks it is really course content, and swaps it
// in — so the answer to "is the repo up to date?" is one command rather than a
// round trip.
//
//   node scripts/unpack-course-content.mjs [--dry-run] [--from <path>]
//
// It only ever writes inside content/courses/<slug>/, and it refuses to touch
// anything if the archive does not look like a course.

import { execFileSync } from "node:child_process";
import {
  cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fromIndex = args.indexOf("--from");
const explicitSource = fromIndex >= 0 ? args[fromIndex + 1] : null;

const REPO = process.cwd();
const COURSES = join(REPO, "content", "courses");
const SEARCH_DIRS = [join(homedir(), "Downloads"), join(homedir(), "Desktop")];

const say = (...m) => console.log(...m);
const die = (m) => {
  console.error(`\n  ${m}\n`);
  process.exit(1);
};

/** Every plausible export: a *content-v*.zip, or an unpacked folder with a course.json. */
function findCandidates() {
  const out = [];
  for (const dir of SEARCH_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      let s;
      try {
        s = statSync(path);
      } catch {
        continue;
      }
      if (s.isFile() && /content-v\d+.*\.zip$/i.test(name)) {
        out.push({ path, mtime: s.mtimeMs, kind: "zip" });
      } else if (s.isDirectory() && existsSync(join(path, "course.json"))) {
        out.push({ path, mtime: s.mtimeMs, kind: "dir" });
      }
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

/** The directory holding course.json, wherever the archive nested it. */
function findCourseRoot(dir, depth = 0) {
  if (existsSync(join(dir, "course.json"))) return dir;
  if (depth > 2) return null;
  for (const name of readdirSync(dir)) {
    const child = join(dir, name);
    try {
      if (statSync(child).isDirectory()) {
        const found = findCourseRoot(child, depth + 1);
        if (found) return found;
      }
    } catch {
      // unreadable entry; keep looking
    }
  }
  return null;
}

/** Refuse anything that is not a complete, self-consistent course. */
function validate(root) {
  let course;
  try {
    course = JSON.parse(readFileSync(join(root, "course.json"), "utf8"));
  } catch (err) {
    die(`course.json will not parse: ${err.message}`);
  }
  if (!course.slug || !Array.isArray(course.modules) || course.modules.length === 0) {
    die("course.json has no slug or no modules — this does not look like a course.");
  }

  const lessons = course.modules.flatMap((m) => m.lessons ?? []);
  if (lessons.length === 0) die("course.json lists no lessons.");

  const missing = lessons.filter((l) => !l.file || !existsSync(join(root, l.file)));
  if (missing.length > 0) {
    die(
      `${missing.length} lesson file(s) named in course.json are not in the archive, ` +
        `starting with ${missing[0].slug ?? missing[0].file}. Nothing has been changed.`
    );
  }

  return { course, lessons };
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const s = statSync(path);
    n += s.isDirectory() ? countFiles(path) : 1;
  }
  return n;
}

/* ------------------------------------------------------------------ main */

const candidates = explicitSource
  ? [{ path: explicitSource, mtime: statSync(explicitSource).mtimeMs, kind: statSync(explicitSource).isDirectory() ? "dir" : "zip" }]
  : findCandidates();

if (candidates.length === 0) {
  die(`No course export found in:\n  ${SEARCH_DIRS.join("\n  ")}`);
}

const source = candidates[0];
say(`\n  Source: ${source.path}`);
say(`          ${new Date(source.mtime).toLocaleString()}`);
if (candidates.length > 1) {
  say(`          (newest of ${candidates.length}; pass --from <path> to choose another)`);
}

const work = mkdtempSync(join(tmpdir(), "course-content-"));
try {
  let root;
  if (source.kind === "zip") {
    execFileSync("unzip", ["-q", source.path, "-d", work], { stdio: "inherit" });
    root = findCourseRoot(work);
  } else {
    root = findCourseRoot(source.path);
  }
  if (!root) die("No course.json found inside that archive.");

  const { course, lessons } = validate(root);
  const target = join(COURSES, course.slug);
  const isNew = !existsSync(target);

  say(`\n  Course: ${course.title ?? course.slug} (${course.slug})`);
  say(`          ${course.modules.length} modules, ${lessons.length} lessons, ${countFiles(root)} files`);
  say(`  Target: content/courses/${course.slug}${isNew ? "  (new)" : ""}`);

  // Nothing to do is worth saying plainly — it is the answer to the question
  // this script exists to settle.
  if (!isNew) {
    try {
      execFileSync("diff", ["-rq", root, target], { stdio: "pipe" });
      say(`\n  Already up to date — the repo matches this export. Nothing changed.\n`);
      process.exit(0);
    } catch {
      // differs; carry on
    }
  }

  if (dryRun) {
    say(`\n  --dry-run: would replace content/courses/${course.slug}. Nothing changed.\n`);
    process.exit(0);
  }

  rmSync(target, { recursive: true, force: true });
  cpSync(root, target, { recursive: true });
  say(`\n  Replaced content/courses/${course.slug}.`);

  try {
    const status = execFileSync(
      "git",
      ["status", "--short", "--untracked-files=all", `content/courses/${course.slug}`],
      { encoding: "utf8" }
    );
    const counts = {};
    for (const line of status.split("\n").filter(Boolean)) {
      const key = line.slice(0, 2).trim() || "?";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const label = { M: "modified", A: "added", D: "deleted", "??": "new" };
    const summary = Object.entries(counts)
      .map(([k, n]) => `${n} ${label[k] ?? k}`)
      .join(", ");
    say(`  Git sees: ${summary || "no change"}`);
  } catch {
    // not a git repo, or git unavailable — the copy still happened
  }

  say(`\n  Next: review the diff, then run the build.\n`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
