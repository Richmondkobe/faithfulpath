#!/usr/bin/env node
//
// Builds and uploads a Following Jesus course's PDFs: one file per chapter, cut
// from the course ebook, plus the lesson worksheets and the Leader's Guide.
//
//   npm run fj:downloads -- "<course folder>"               # build, check, upload
//   npm run fj:downloads -- "<course folder>" --dry-run     # build and check only
//   npm run fj:downloads -- "<course folder>" --only worksheets   # just these (or chapters, leaders-guide)
//
// The course folder is Richmond's, for example
// "~/Desktop/Following Jesus Begin Course". Everything goes to the private
// course-downloads bucket under following-jesus-<course>/, and reaches buyers
// only through a signed URL from a page that has checked the purchase.
//
// What a chapter file holds, as Richmond chose on 6 October 2026:
//   * the title and copyright pages, so the rights notice travels with it;
//   * the chapter itself, found from the ebook's own bookmarks;
//   * all six Support Pages, because every chapter sends readers to them "at the
//     back of this book", including the pages for danger, abuse and self-harm;
//   * for the last chapter only, the "What you have learned" summary that
//     closes the book.
// The pages are copied, not re-typeset: the wording is exactly the ebook's.

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import { getDocumentProxy } from "unpdf";

const BUCKET = "course-downloads";

// Per course: where its files are inside Richmond's folder, and what to expect.
const COURSES = {
  begin: {
    ebook: "01 Book and Reviews/Following Jesus - Begin - Ebook.pdf",
    worksheet: (n) => `06 Worksheets/Begin-Lesson-${pad(n)}-Worksheet.pdf`,
    leadersGuide: "04 Leader's Guide/Begin-Leaders-Guide-Final.pdf",
    chapters: 8,
    // Page numbers are 1-based, as a PDF reader shows them.
    frontPages: [2, 3],
  },
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function die(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
if (only && !["worksheets", "chapters", "leaders-guide"].includes(only)) die(`--only takes worksheets, chapters or leaders-guide, not "${only}".`);
const root = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--only" && args[i - 1] !== "--course");
const courseSlug = args.includes("--course") ? args[args.indexOf("--course") + 1] : "begin";
const course = COURSES[courseSlug];
if (!root) die('Usage: npm run fj:downloads -- "<course folder>" [--course begin] [--dry-run]');
if (!course) die(`No course "${courseSlug}". Known: ${Object.keys(COURSES).join(", ")}`);

const folder = `following-jesus-${courseSlug}`;
const outDir = join(process.env.TMPDIR ?? "/tmp", `fj-downloads-${courseSlug}`);

/* ---------------------------------------------------- chapter page ranges */

// Read the ebook's bookmarks and turn them into page ranges. Relying on the
// bookmarks rather than typed-in page numbers means a corrected ebook with a
// page added in Chapter 3 still cuts correctly — and the checks below stop the
// run if the bookmarks are not the shape this expects.
async function chapterRanges(bytes) {
  const doc = await getDocumentProxy(new Uint8Array(bytes));
  const outline = (await doc.getOutline()) ?? [];
  const marks = [];
  for (const item of outline) {
    const dest = typeof item.dest === "string" ? await doc.getDestination(item.dest) : item.dest;
    if (!dest) continue;
    marks.push({ title: item.title.trim(), page: (await doc.getPageIndex(dest[0])) + 1 });
  }

  const chapterMarks = marks.filter((m) => /^Chapter\s*\d+/i.test(m.title));
  const support = marks.find((m) => /^Support Pages$/i.test(m.title));
  if (chapterMarks.length !== course.chapters) {
    die(`Expected ${course.chapters} chapter bookmarks, found ${chapterMarks.length}.`);
  }
  if (!support) die('No "Support Pages" bookmark in the ebook.');

  chapterMarks.forEach((m, i) => {
    const n = Number(m.title.match(/^Chapter\s*(\d+)/i)[1]);
    if (n !== i + 1) die(`Chapter bookmarks out of order: "${m.title}" is in place ${i + 1}.`);
  });

  return {
    numPages: doc.numPages,
    chapters: chapterMarks.map((m, i) => ({
      number: i + 1,
      title: m.title.replace(/^Chapter\s*\d+\s*/i, ""),
      first: m.page,
      // A chapter runs to the page before the next one. The last runs up to
      // the Support Pages, which takes in the closing summary.
      last: (chapterMarks[i + 1]?.page ?? support.page) - 1,
    })),
    support: { first: support.page, last: doc.numPages },
  };
}

function range(first, last) {
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

async function buildChapter(source, chapter, support) {
  const pages = [...course.frontPages, ...range(chapter.first, chapter.last), ...range(support.first, support.last)];
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, pages.map((p) => p - 1));
  copied.forEach((p) => out.addPage(p));
  out.setTitle(`Following Jesus: Begin — Chapter ${chapter.number}: ${chapter.title}`);
  out.setAuthor("Richmond Kobe");
  return { bytes: await out.save(), pages };
}

/* ------------------------------------------------------------------- run */

const ebookBytes = await readFile(join(root, course.ebook));
const ranges = await chapterRanges(ebookBytes);
const ebook = await PDFDocument.load(ebookBytes);
if (ebook.getPageCount() !== ranges.numPages) die("The two PDF readers disagree on the page count.");

await mkdir(outDir, { recursive: true });
const files = [];

for (const chapter of ranges.chapters) {
  const { bytes, pages } = await buildChapter(ebook, chapter, ranges.support);
  const name = `chapter-${pad(chapter.number)}.pdf`;
  await writeFile(join(outDir, name), bytes);
  files.push({ name, bytes });
  console.log(
    `  ${name}  Chapter ${chapter.number}: ${chapter.title}  ` +
      `(pages ${course.frontPages.join(", ")}, ${chapter.first}–${chapter.last}, ` +
      `${ranges.support.first}–${ranges.support.last}; ${pages.length} pages)`
  );
}

for (let n = 1; n <= course.chapters; n++) {
  const bytes = await readFile(join(root, course.worksheet(n)));
  files.push({ name: `worksheet-${pad(n)}.pdf`, bytes });
}
files.push({ name: "leaders-guide.pdf", bytes: await readFile(join(root, course.leadersGuide)) });

for (const f of files) {
  if (!Buffer.from(f.bytes.subarray(0, 5)).toString("latin1").startsWith("%PDF-")) die(`${f.name} is not a PDF.`);
}

if (only) {
  const prefix = { worksheets: "worksheet-", chapters: "chapter-", "leaders-guide": "leaders-guide" }[only];
  files.splice(0, files.length, ...files.filter((f) => f.name.startsWith(prefix)));
  console.log(`\n  --only ${only}: ${files.length} file(s)`);
}

console.log(`\n  ${files.length} files built in ${outDir}`);
if (dryRun) {
  console.log("  Dry run: nothing uploaded.\n");
  process.exit(0);
}

/* ---------------------------------------------------------------- upload */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) die("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local).");
const supabase = createClient(url, key, { auth: { persistSession: false } });

// A bucket of its own, private, that takes PDFs and nothing else. course-media
// is left exactly as it is.
const { data: bucket } = await supabase.storage.getBucket(BUCKET);
if (!bucket) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    allowedMimeTypes: ["application/pdf"],
    fileSizeLimit: "50MB",
  });
  if (error) die(`Could not create the ${BUCKET} bucket: ${error.message}`);
  console.log(`  Created the private ${BUCKET} bucket.`);
} else if (bucket.public) {
  die(`The ${BUCKET} bucket is public. It must be private; stopping before uploading anything.`);
}

for (const f of files) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${folder}/${f.name}`, f.bytes, { contentType: "application/pdf", upsert: true });
  if (error) die(`Upload of ${f.name} failed: ${error.message}`);
}

const { data: listed } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
const names = new Set((listed ?? []).map((o) => o.name));
const missing = files.filter((f) => !names.has(f.name));
// The bucket's copy, byte for byte, against what was meant to go up. Storage
// can hand back the old file for a few seconds after a replacement, so a
// mismatch is retried for up to 15 seconds before it counts.
for (const f of files) {
  let same = false;
  for (let attempt = 0; attempt < 6 && !same; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 3000));
    const { data } = await supabase.storage.from(BUCKET).download(`${folder}/${f.name}`);
    same = Buffer.from(await data.arrayBuffer()).equals(Buffer.from(f.bytes));
  }
  if (!same) die(`${f.name} in the bucket is still not the file that was uploaded.`);
}
if (missing.length) die(`Not in the bucket after upload: ${missing.map((f) => f.name).join(", ")}`);
console.log(`  Uploaded ${files.length} files to ${BUCKET}/${folder}/\n`);
