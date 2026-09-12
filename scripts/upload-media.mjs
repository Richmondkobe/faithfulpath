#!/usr/bin/env node
//
// Uploads a course recording into the private Supabase bucket.
//
//   npm run media:upload -- path/to/welcome.mp4
//   npm run media:upload -- path/to/01-come-as-you-are.mp3 --as 01-come-as-you-are
//   npm run media:upload -- file.mp4 --list          # show what is already there
//
// The key is worked out from the file name: an .mp4 goes to videos/<id>.mp4 and
// an .mp3 to audio/<id>.mp3, which is exactly what the lesson pages look for.
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
const source = args.find((a) => !a.startsWith("--") && a !== overrideId);

const die = (m) => {
  console.error(`\n  ${m}\n`);
  process.exit(1);
};

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) {
  die("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (node --env-file=.env.local).");
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function listBucket() {
  for (const folder of ["videos", "audio"]) {
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 });
    if (error) {
      console.log(`  ${folder}/  — could not list: ${error.message}`);
      continue;
    }
    console.log(`\n  ${folder}/`);
    if (!data || data.length === 0) console.log("    (empty)");
    for (const o of data ?? []) {
      const mb = (o.metadata?.size ?? 0) / 1024 / 1024;
      console.log(`    ${o.name.padEnd(44)} ${mb.toFixed(1)} MB`);
    }
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

const key_ = `${kind}/${id}${ext}`;
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

const { data: check } = await supabase.storage.from(BUCKET).list(kind, { search: `${id}${ext}` });
const stored = (check ?? []).find((o) => o.name === `${id}${ext}`);
console.log(`  Uploaded. In the bucket: ${((stored?.metadata?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`);
console.log(`\n  It will appear on any lesson that references "${id}".\n`);
