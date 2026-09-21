#!/usr/bin/env node
//
// Uploads a course recording into the private Supabase bucket.
//
//   npm run media:upload -- path/to/welcome.mp4
//   npm run media:upload -- path/to/01-come-as-you-are.mp3 --as 01-come-as-you-are
//   npm run media:upload -- path/to/14-lesson-08.mp3 --course before-you-say-yes
//   npm run media:upload -- --list                   # show what is already there
//
// The key is worked out from the file name: an .mp4 goes to videos/<id>.mp4 and
// an .mp3 to audio/<id>.mp3, which is exactly what the lesson pages look for.
//
// --course puts it in a folder of its own: audio/<course>/<id>.mp3. The
// Spiritual Reset's audio sits directly under audio/, where it has always
// been; a course added later has a folder, so two courses can hold a file of
// the same name without one overwriting the other. lib/course-media.ts builds
// the key the pages ask for, and this has to match it — a file uploaded a
// level too high is not an error anywhere, it is a lesson that quietly goes on
// playing the old recording.
// Media never goes into git — it is too large, and the bucket is private so a
// recording cannot be fetched without a signed URL from a members page.

import { readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "course-media";

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const asIndex = args.indexOf("--as");
const overrideId = asIndex >= 0 ? args[asIndex + 1] : null;
const courseIndex = args.indexOf("--course");
const course = courseIndex >= 0 ? args[courseIndex + 1] : null;
// Both flag values are ordinary words, so neither may be mistaken for the file.
const source = args.find(
  (a) => !a.startsWith("--") && a !== overrideId && a !== course
);

const die = (m) => {
  console.error(`\n  ${m}\n`);
  process.exit(1);
};

// Checked here rather than at the upload, so a typo costs nothing. The shape is
// the one keyFor() in lib/course-media.ts accepts.
if (courseIndex >= 0 && (!course || course.startsWith("--"))) {
  die("--course needs a course slug, for example: --course before-you-say-yes");
}
if (course && !/^[a-z0-9-]+$/.test(course)) {
  die(`"${course}" is not a usable course slug — lower case letters, digits and hyphens only.`);
}

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) {
  die("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (node --env-file=.env.local).");
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function listBucket() {
  // A course folder comes back in the listing as an entry with no metadata.
  // Descending into it is what makes --list able to confirm an upload made
  // with --course; without it a course's recordings are invisible here.
  async function show(folder, indent = "    ") {
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 });
    if (error) {
      console.log(`${indent}— could not list ${folder}/: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      console.log(`${indent}(empty)`);
      return;
    }
    for (const o of data) {
      if (!o.metadata) {
        console.log(`${indent}${o.name}/`);
        await show(`${folder}/${o.name}`, `${indent}  `);
        continue;
      }
      const mb = (o.metadata.size ?? 0) / 1024 / 1024;
      console.log(`${indent}${o.name.padEnd(44)} ${mb.toFixed(1)} MB`);
    }
  }

  for (const folder of ["videos", "audio"]) {
    console.log(`\n  ${folder}/`);
    await show(folder);
  }
  console.log();
}

if (listOnly && !source) {
  await listBucket();
  process.exit(0);
}

if (!source) die("Usage: npm run media:upload -- <file> [--as <id>] [--list]");

let stat;
try {
  stat = statSync(source);
} catch {
  die(`No such file: ${source}`);
}

const ext = extname(source).toLowerCase();
const kind = ext === ".mp4" ? "videos" : ext === ".mp3" ? "audio" : null;
if (!kind) die(`Only .mp4 and .mp3 are used by the course; got "${ext}".`);

const id = (overrideId ?? basename(source, ext)).toLowerCase();
if (!/^[a-z0-9-]+$/.test(id)) {
  die(`"${id}" is not a usable id — lower case letters, digits and hyphens only. Use --as to set one.`);
}

const folder = course ? `${kind}/${course}` : kind;
const key_ = `${folder}/${id}${ext}`;
const mb = stat.size / 1024 / 1024;
console.log(`\n  ${source}`);
console.log(`  ${mb.toFixed(1)} MB  ->  ${BUCKET}/${key_}`);

// The project rejects anything over its per-object limit, and the failure comes
// back as an opaque message, so say it plainly first.
if (mb > 50) {
  console.log(`\n  Warning: this is over the 50 MB per-object limit on this project.`);
  console.log(`  Compress it before uploading, or the upload will be rejected.`);
}

const { error } = await supabase.storage
  .from(BUCKET)
  .upload(key_, readFileSync(source), {
    contentType: ext === ".mp4" ? "video/mp4" : "audio/mpeg",
    upsert: true,
  });

if (error) die(`Upload failed: ${error.message}`);

const { data: check } = await supabase.storage.from(BUCKET).list(folder, { search: `${id}${ext}` });
const stored = (check ?? []).find((o) => o.name === `${id}${ext}`);
console.log(`  Uploaded. In the bucket: ${((stored?.metadata?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`);
console.log(`\n  It will appear on any lesson that references "${id}"${course ? ` in ${course}` : ""}.\n`);
