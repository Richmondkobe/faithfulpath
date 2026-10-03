#!/usr/bin/env node
//
// Builds the free sample of each published book and uploads it.
//
//   node --env-file=.env.local scripts/build-samples.mjs          # build and upload
//   node --env-file=.env.local scripts/build-samples.mjs --dry    # report the cuts only
//   node --env-file=.env.local scripts/build-samples.mjs --only <slug>   # one book
//
// Without --only every published book is rebuilt. That is the right default
// after a change to how the cut is chosen, but publishing one new book does not
// need the other five rewritten, so --only narrows it to that slug.
//
// The sample is the front matter, the contents page and the first chapter: every
// page up to the one where chapter two begins. Re-run it after revising a book —
// the page a chapter starts on moves, and a sample cut to the old boundary ends
// mid-sentence or gives away a chapter that is no longer the first.
//
// Where the boundary comes from, in order:
//   1. The PDF outline, if it has one. A book's own bookmarks are the author's
//      structure rather than a guess from the text.
//   2. Failing that, the first page whose text OPENS with a chapter heading.
//      Anywhere-on-the-page matching is no use: the contents page names every
//      chapter, and a running header repeats one on every page of it.
//   3. Failing both, the first 12 pages.
//
// Headings are matched after collapsing letter spacing ("C H A P T E R  2") and
// in words as well as digits ("CHAPTER TWO"), because the five books do all
// three between them.

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFHexString, PDFString } from "pdf-lib";
import { extractText, getDocumentProxy } from "unpdf";

const FALLBACK_PAGES = 12;
const SAMPLES_PREFIX = "samples";
const dry = process.argv.includes("--dry");

/** The slug given to --only, as either "--only slug" or "--only=slug". */
const only = (() => {
  const i = process.argv.findIndex((a) => a === "--only" || a.startsWith("--only="));
  if (i === -1) return null;
  const value = process.argv[i].startsWith("--only=")
    ? process.argv[i].slice("--only=".length)
    : process.argv[i + 1];
  if (!value || value.startsWith("--")) {
    console.error("\n  --only needs a book slug, e.g. --only following-jesus-book-1-begin\n");
    process.exit(1);
  }
  return value;
})();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) {
  console.error("\n  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (node --env-file=.env.local).\n");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

/** "C H A P T E R" -> "CHAPTER", so a letter-spaced heading still matches. */
const deSpace = (s) => s.replace(/\b(?:[A-Za-z]\s){2,}[A-Za-z]\b/g, (m) => m.replace(/\s+/g, ""));

const WORD_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

/** Page numbers of the first two chapters, from the PDF's own outline. */
function chaptersFromOutline(doc, bookTitle) {
  const outlinesRef = doc.catalog.get(PDFName.of("Outlines"));
  if (!outlinesRef) return [];
  const outlines = doc.context.lookup(outlinesRef, PDFDict);
  const pageTags = doc.getPages().map((p) => p.ref.tag);
  const pageOf = (dict) => {
    let d = dict.get(PDFName.of("Dest"));
    if (!d) d = doc.context.lookup(dict.get(PDFName.of("A")), PDFDict)?.get(PDFName.of("D"));
    const arr = doc.context.lookup(d, PDFArray);
    const target = arr?.get(0);
    if (!(target instanceof PDFRef)) return null;
    const i = pageTags.indexOf(target.tag);
    return i >= 0 ? i + 1 : null;
  };

  const found = [];
  let child = outlines?.get(PDFName.of("First"));
  let guard = 0;
  while (child && guard++ < 200) {
    const d = doc.context.lookup(child, PDFDict);
    if (!d) break;
    const t = d.get(PDFName.of("Title"));
    const title = t instanceof PDFHexString || t instanceof PDFString ? t.decodeText() : "";
    const page = pageOf(d);
    if (page) found.push({ title: title.trim(), page });
    child = d.get(PDFName.of("Next"));
  }
  if (!found.length) return [];

  // An explicit "Chapter N" outline, where it exists.
  const numbered = found
    .map((e) => {
      const m = deSpace(e.title).match(/^Chapter\s*(\d+|one|two|three)\b/i);
      if (!m) return null;
      const n = /^\d+$/.test(m[1]) ? Number(m[1]) : WORD_NUMBERS[m[1].toLowerCase()];
      return n ? { n, page: e.page, title: e.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.n - b.n);
  if (numbered.length >= 2) return numbered;

  // Otherwise the body starts after the front matter, and the entries that
  // follow it are the chapters whatever they are called. The book's own title
  // is front matter too — it is the title page, and treating it as chapter one
  // cuts the sample off before the real first chapter has started.
  const frontMatter = /^(contents|copyright|title page|toolkit|practical toolkit|toolkit contents|introduction|why this book exists|before you begin|a note|about the author|dedication|foreword|preface|acknowledge)/i;
  const norm = (x) => x.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const body = found.filter(
    (e) => !frontMatter.test(e.title) && norm(e.title) !== norm(bookTitle ?? "")
  );
  if (body.length >= 2) {
    return [
      { n: 1, page: body[0].page, title: body[0].title },
      { n: 2, page: body[1].page, title: body[1].title },
    ];
  }
  return [];
}

/** Page numbers of the first two chapters, from pages that OPEN with a heading. */
async function chaptersFromText(bytes) {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: false });
  const opens = new Map();
  text.forEach((raw, i) => {
    const t = deSpace(raw.replace(/\s+/g, " ").trim());
    const m = t.match(/^CHAPTER\s*(\d+|ONE|TWO|THREE|FOUR|FIVE)\b/i);
    if (!m) return;
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : WORD_NUMBERS[m[1].toLowerCase()];
    if (n && !opens.has(n)) opens.set(n, i + 1);
  });
  return [...opens.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, page]) => ({ n, page, title: `Chapter ${n}` }));
}

const { data: allBooks, error } = await sb
  .from("products")
  .select("slug,title,pdf_path")
  .eq("published", true)
  .order("slug");
if (error) {
  console.error(`\n  Could not list products: ${error.message}\n`);
  process.exit(1);
}

// An unmatched --only stops rather than quietly building nothing, which would
// otherwise print an empty table and read as success.
const books = only ? allBooks.filter((b) => b.slug === only) : allBooks;
if (only && !books.length) {
  console.error(`\n  No published book has the slug "${only}". Published books are:`);
  for (const b of allBooks) console.error(`    ${b.slug}`);
  console.error();
  process.exit(1);
}

console.log();
const rows = [];
for (const book of books) {
  if (!book.pdf_path) {
    console.log(`  ${book.slug}: no pdf_path, skipped`);
    continue;
  }
  const { data: file, error: dlError } = await sb.storage.from("guides").download(book.pdf_path);
  if (dlError) {
    console.log(`  ${book.slug}: download failed — ${dlError.message}`);
    continue;
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const total = doc.getPageCount();

  let chapters = chaptersFromOutline(doc, book.title);
  let how = "outline";
  if (chapters.length < 2) {
    chapters = await chaptersFromText(bytes);
    how = "text";
  }

  let last, note;
  if (chapters.length >= 2) {
    last = chapters[1].page - 1;
    note = `${how}: ch1 p${chapters[0].page}, ch2 p${chapters[1].page}`;
  } else {
    last = Math.min(FALLBACK_PAGES, total);
    note = `no chapter boundary found — first ${last} pages`;
  }
  // A boundary that would give away most of the book, or almost none of it, is
  // more likely a detection failure than a very long first chapter.
  if (last < 4 || last > Math.max(FALLBACK_PAGES, Math.ceil(total * 0.3))) {
    last = Math.min(FALLBACK_PAGES, total);
    note += ` — implausible, using first ${last} pages instead`;
  }

  const sample = await PDFDocument.create();
  const copied = await sample.copyPages(doc, Array.from({ length: last }, (_, i) => i));
  copied.forEach((p) => sample.addPage(p));
  sample.setTitle(`${book.title} — free sample`);
  sample.setAuthor("Richmond Kobe");
  sample.setProducer("Faithful Path Community");
  const out = Buffer.from(await sample.save());

  const path = `${SAMPLES_PREFIX}/${book.slug}-sample.pdf`;
  rows.push({ slug: book.slug, total, first: 1, last, out: out.length, note });

  if (dry) continue;
  const { error: upError } = await sb.storage.from("covers").upload(path, out, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upError) console.log(`  ${book.slug}: upload failed — ${upError.message}`);
}

console.log(`  ${"book".padEnd(32)} pages   sample      size  how`);
for (const r of rows) {
  console.log(
    `  ${r.slug.padEnd(32)} ${String(r.total).padStart(5)}   p${r.first}–${String(r.last).padEnd(5)} ` +
      `${(r.out / 1024).toFixed(0).padStart(5)}KB  ${r.note}`
  );
}
console.log(
  dry
    ? `\n  Dry run — nothing uploaded.${only ? ` Only ${only}.` : ""}\n`
    : `\n  Uploaded ${rows.length} sample(s) to covers/${SAMPLES_PREFIX}/.\n`
);
