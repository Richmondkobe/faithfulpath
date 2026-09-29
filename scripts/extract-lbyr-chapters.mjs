#!/usr/bin/env node
//
// Turn each chapter of Lead Before You're Ready into a web page's worth of
// blocks.
//
//   node --env-file=.env.local scripts/extract-lbyr-chapters.mjs
//   node --env-file=.env.local scripts/extract-lbyr-chapters.mjs --dry
//
// Writes content/courses/lead-before-youre-ready/lesson-NN/chapter.json, which
// the chapter page renders through the same components as the rest of the
// course. Nothing is rewritten: the words are the book's, and the fidelity
// check compares them back.
//
// Structure comes from the fonts, which are unambiguous here. Across all ten
// chapters there are exactly seven text roles and one bullet glyph:
//
//   Carlito-Bold@23            chapter title
//   Carlito-Bold@15            "Chapter N: Reflect and Act"
//   Carlito-Bold@12.5          subheading
//   LiberationSerif-Bold@11.5  bold run inside a paragraph
//   LiberationSerif-Bold@11    a numbered item on the Reflect and Act page
//   LiberationSerif@11.5       body
//   LiberationSerif@9.5        running header and page number — dropped
//   OpenSymbol@11.5            list bullet
//
// No italic font is used in the chapters, and there are no tables, so nothing
// here has to guess at emphasis or reconstruct a grid.

import { createClient } from "@supabase/supabase-js";
import { getDocumentProxy } from "unpdf";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dry = process.argv.includes("--dry");
const ROOT = join("content", "courses", "lead-before-youre-ready");
const CHAPTERS = 10;

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) {
  console.error("\n  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: product, error: pErr } = await sb
  .from("products").select("pdf_path").eq("slug", "lead-before-youre-ready").single();
if (pErr || !product?.pdf_path) {
  console.error(`\n  Could not find the book: ${pErr?.message ?? "no pdf_path"}\n`);
  process.exit(1);
}
const { data: file, error: dErr } = await sb.storage.from("guides").download(product.pdf_path);
if (dErr || !file) {
  console.error(`\n  Could not download the book: ${dErr?.message}\n`);
  process.exit(1);
}
const bytes = new Uint8Array(await file.arrayBuffer());

/** Font role for a text run, by its real font name and size. */
function roleOf(name, size) {
  const f = name.replace(/^[A-Z]{6}\+/, "");
  if (f === "Carlito-Bold" && size >= 20) return "title";
  if (f === "Carlito-Bold" && size >= 14) return "h2";
  if (f === "Carlito-Bold") return "h3";
  if (f === "OpenSymbol") return "bullet";
  if (f.endsWith("-Bold")) return "strong";
  if (size < 10.5) return "chrome";          // running header, page number
  return "body";
}

const pdf = await getDocumentProxy(bytes);

/** Every page's runs, as lines with their roles. */
async function linesOf(pageNumber) {
  const page = await pdf.getPage(pageNumber);
  await page.getOperatorList();                      // loads the fonts
  const tc = await page.getTextContent();

  const runs = [];
  for (const item of tc.items) {
    if (!item.str) continue;
    let name = item.fontName;
    try { name = page.commonObjs.get(item.fontName)?.name ?? name; } catch { /* keep the id */ }
    const size = Math.round(Math.abs(item.transform[0]) * 2) / 2;
    const role = roleOf(name, size);
    if (role === "chrome") continue;
    runs.push({ x: item.transform[4], y: item.transform[5], role, text: item.str });
  }

  // Runs on the same baseline are one line. 2pt of slack for rounding.
  const lines = [];
  for (const run of runs.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - run.y) < 2) last.runs.push(run);
    else lines.push({ y: run.y, x: run.x, runs: [run] });
  }
  for (const line of lines) {
    line.runs.sort((a, b) => a.x - b.x);
    line.x = line.runs[0].x;
    line.role = line.runs.find((r) => r.role !== "body" && r.role !== "strong")?.role
      ?? (line.runs.every((r) => r.role === "strong") ? "strong" : "body");
  }
  return lines;
}

/** The inline runs of a line, merged and with bold marked. */
const inlineOf = (line) => {
  const out = [];
  for (const run of line.runs) {
    if (run.role === "bullet") continue;
    const bold = run.role === "strong";
    const last = out[out.length - 1];
    if (last && last.bold === bold) last.text += run.text;
    else out.push({ text: run.text, bold });
  }
  return out.filter((r) => r.text.length);
};

// Where each chapter starts and ends, from its own headings.
const opensAt = new Map();
const worksheetAt = new Map();
for (let p = 1; p <= pdf.numPages; p++) {
  const lines = await linesOf(p);
  for (const line of lines) {
    const t = line.runs.map((r) => r.text).join("").replace(/\s+/g, " ").trim();
    const body = t.match(/^Chapter (\d+)\s*[–-]\s/);
    if (body && line.role === "title" && !opensAt.has(Number(body[1]))) opensAt.set(Number(body[1]), p);
    const ws = t.match(/^Chapter (\d+):\s*Reflect and Act/);
    if (ws && !worksheetAt.has(Number(ws[1]))) worksheetAt.set(Number(ws[1]), p);
  }
}
for (let n = 1; n <= CHAPTERS; n++) {
  if (!opensAt.has(n) || !worksheetAt.has(n)) {
    console.error(`\n  Could not locate chapter ${n} — the book's headings have changed shape.\n`);
    process.exit(1);
  }
}

const rows = [];
for (let n = 1; n <= CHAPTERS; n++) {
  const first = opensAt.get(n);
  // The chapter runs up to, but not including, its Reflect and Act page: that
  // page is the worksheet, which the lesson already offers on its own page.
  const last = worksheetAt.get(n) - 1;

  const blocks = [];
  let para = null;
  const flush = () => { if (para && para.c.length) blocks.push(para); para = null; };

  for (let p = first; p <= last; p++) {
    const lines = await linesOf(p);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const inline = inlineOf(line);
      if (!inline.length) continue;

      if (line.role === "title") { flush(); blocks.push({ t: "title", c: inline }); continue; }
      if (line.role === "h2" || line.role === "h3") { flush(); blocks.push({ t: "h", c: inline }); continue; }
      if (line.role === "bullet") { flush(); blocks.push({ t: "li", c: inline }); continue; }

      // A new paragraph where the gap to the line above is bigger than the
      // leading, which is how the book separates them.
      const prev = lines[i - 1];
      const gap = prev ? prev.y - line.y : 0;
      if (!para || (prev && gap > 20)) { flush(); para = { t: "p", c: [] }; }
      for (const run of inline) {
        const lastRun = para.c[para.c.length - 1];
        const joiner = para.c.length ? " " : "";
        if (lastRun && lastRun.bold === run.bold) lastRun.text += joiner + run.text;
        else para.c.push({ ...run, text: (joiner && para.c.length ? "" : "") + run.text });
      }
    }
  }
  flush();

  // Tidy the doubled spaces line joining leaves behind.
  for (const b of blocks) for (const r of b.c) r.text = r.text.replace(/\s+/g, " ").trim();

  const title = blocks.find((b) => b.t === "title");
  const words = blocks.flatMap((b) => b.c.map((r) => r.text)).join(" ").split(/\s+/).filter(Boolean).length;
  rows.push({ n, first, last, blocks: blocks.length, words, title: title ? title.c.map((r) => r.text).join("") : "?" });

  if (dry) continue;
  const dir = join(ROOT, `lesson-${String(n).padStart(2, "0")}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "chapter.json"), JSON.stringify({ chapter: n, pages: [first, last], blocks }, null, 2) + "\n");
}

console.log();
for (const r of rows) {
  console.log(`  ch${String(r.n).padStart(2)}  p${r.first}–${String(r.last).padEnd(3)} ${String(r.blocks).padStart(3)} blocks  ${String(r.words).padStart(5)} words   ${r.title.slice(0, 46)}`);
}
console.log(dry ? "\n  Dry run — nothing written.\n" : `\n  Wrote ${rows.length} chapter.json files.\n`);
