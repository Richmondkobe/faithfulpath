#!/usr/bin/env node
//
// Cut each chapter of Lead Before You're Ready out of the book.
//
//   node --env-file=.env.local scripts/build-lbyr-chapters.mjs        # upload
//   node --env-file=.env.local scripts/build-lbyr-chapters.mjs --dry  # report only
//
// The course shows each chapter inside the members' area. Rather than
// reconstruct ten chapters as Markdown — which would lose the italicised Greek
// and Hebrew, both tables, and every heading boundary, with nothing reviewed to
// check the result against — it serves the book's own pages.
//
// They go to the PRIVATE guides bucket, beside the book itself. The store's
// free samples are public on purpose; a chapter is what the book is sold for,
// so it is streamed to a signed-in member by
// app/members/courses/lead-before-youre-ready/lessons/[slug]/chapter and
// reachable no other way.
//
// Page ranges are found from the chapter headings rather than hard-coded, so a
// revised book cannot silently shift a chapter by a page.

import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import { extractText, getDocumentProxy } from "unpdf";

const dry = process.argv.includes("--dry");
const BOOK_SLUG = "lead-before-youre-ready";
const CHAPTERS = 10;

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) {
  console.error("\n  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: product, error: pErr } = await sb
  .from("products")
  .select("slug,title,pdf_path")
  .eq("slug", BOOK_SLUG)
  .single();
if (pErr || !product?.pdf_path) {
  console.error(`\n  Could not find the book: ${pErr?.message ?? "no pdf_path"}\n`);
  process.exit(1);
}

const { data: file, error: dErr } = await sb.storage.from("guides").download(product.pdf_path);
if (dErr || !file) {
  console.error(`\n  Could not download the book: ${dErr?.message}\n`);
  process.exit(1);
}
const bytes = Buffer.from(await file.arrayBuffer());
console.log(`\n  ${product.pdf_path}  (${(bytes.length / 1024).toFixed(0)} KB)\n`);

/** Where each chapter opens, and where its Reflect and Act page is. */
const pdf = await getDocumentProxy(new Uint8Array(bytes));
const { text } = await extractText(pdf, { mergePages: false });
const flat = text.map((t) => t.replace(/\s+/g, " ").trim());

const opensAt = new Map();      // chapter -> first page
const worksheetAt = new Map();  // chapter -> Reflect and Act page
flat.forEach((t, i) => {
  const body = t.match(/^(?:LEAD BEFORE YOU[’']RE READY\s*)?Chapter (\d+)\s*[–-]\s/);
  if (body && !opensAt.has(Number(body[1]))) opensAt.set(Number(body[1]), i + 1);
  const ws = t.match(/^(?:LEAD BEFORE YOU[’']RE READY\s*)?Chapter (\d+):\s*Reflect and Act/);
  if (ws && !worksheetAt.has(Number(ws[1]))) worksheetAt.set(Number(ws[1]), i + 1);
});

const missing = [];
for (let n = 1; n <= CHAPTERS; n++) {
  if (!opensAt.has(n)) missing.push(`chapter ${n} opening`);
  if (!worksheetAt.has(n)) missing.push(`chapter ${n} Reflect and Act`);
}
if (missing.length) {
  console.error(`  Could not locate: ${missing.join(", ")}`);
  console.error("  The book's headings have changed shape — fix the patterns above.\n");
  process.exit(1);
}

const doc = await PDFDocument.load(bytes, { updateMetadata: false });
const total = doc.getPageCount();

const rows = [];
for (let n = 1; n <= CHAPTERS; n++) {
  const first = opensAt.get(n);
  // A chapter runs to its own Reflect and Act page, which is included: it is
  // the chapter's last page in the book and the worksheet the lesson offers
  // separately is the same material, so leaving it out would look like a gap.
  const last = worksheetAt.get(n);
  if (last < first) {
    console.error(`  chapter ${n}: Reflect and Act (p${last}) precedes the opening (p${first})`);
    process.exit(1);
  }
  const nextOpens = opensAt.get(n + 1) ?? total + 1;
  if (last >= nextOpens) {
    console.error(`  chapter ${n}: runs to p${last}, past where chapter ${n + 1} opens (p${nextOpens})`);
    process.exit(1);
  }

  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, Array.from({ length: last - first + 1 }, (_, i) => first - 1 + i));
  pages.forEach((p) => out.addPage(p));
  out.setTitle(`${product.title} — Chapter ${n}`);
  out.setAuthor("Richmond Kobe");
  out.setProducer("Faithful Path Community");
  const buf = Buffer.from(await out.save());

  rows.push({ n, first, last, pages: last - first + 1, size: buf.length });
  if (dry) continue;

  const path = `${BOOK_SLUG}/chapters/chapter-${String(n).padStart(2, "0")}.pdf`;
  const { error } = await sb.storage.from("guides").upload(path, buf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) console.log(`  chapter ${n}: upload failed — ${error.message}`);
}

console.log(`  ${"chapter".padEnd(9)} pages        size`);
for (const r of rows) {
  console.log(
    `  ${String(r.n).padStart(7)}   p${r.first}–${String(r.last).padEnd(6)} ${String(r.pages).padStart(2)}pp  ${(r.size / 1024).toFixed(0).padStart(4)} KB`
  );
}
console.log(
  dry
    ? "\n  Dry run — nothing uploaded.\n"
    : `\n  Uploaded ${rows.length} chapter(s) to guides/${BOOK_SLUG}/chapters/.\n`
);
