#!/usr/bin/env node
//
// Every word of every chapter still reaches the page.
//
//   node --env-file=.env.local scripts/verify-lbyr-chapters.mjs
//
// The chapters are extracted from the book rather than transcribed, and the
// brief is that the wording stays exactly as the book has it. So this compares
// the words of the source pages against the words of chapter.json, counting
// repeats, and fails on anything lost. The running header and the page number
// are expected to be gone; everything else is not.

import { createClient } from "@supabase/supabase-js";
import { getDocumentProxy, extractText } from "unpdf";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "lead-before-youre-ready");
const sb = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  { auth: { persistSession: false } }
);
const { data: product } = await sb.from("products").select("pdf_path").eq("slug", "lead-before-youre-ready").single();
const { data: file } = await sb.storage.from("guides").download(product.pdf_path);
const bytes = new Uint8Array(await file.arrayBuffer());
const { text } = await extractText(await getDocumentProxy(bytes), { mergePages: false });

const norm = (s) =>
  s.replace(/\s+/g, " ").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim();

/** Words the source has and the page does not, counting repeats. */
function dropped(src, out) {
  const have = new Map();
  for (const w of out.split(" ").filter(Boolean)) have.set(w, (have.get(w) ?? 0) + 1);
  const missing = [];
  for (const w of src.split(" ").filter(Boolean)) {
    const n = have.get(w) ?? 0;
    if (n === 0) missing.push(w);
    else have.set(w, n - 1);
  }
  return missing;
}

console.log();
let bad = 0;
for (let n = 1; n <= 10; n++) {
  const path = join(ROOT, `lesson-${String(n).padStart(2, "0")}`, "chapter.json");
  const doc = JSON.parse(readFileSync(path, "utf8"));
  const [first, last] = doc.pages;

  const rendered = norm(doc.blocks.flatMap((b) => b.c.map((r) => r.text)).join(" "));
  const source = norm(
    text
      .slice(first - 1, last)
      .join(" ")
      // The running header and the page number are chrome, dropped on purpose.
      .replace(/LEAD BEFORE YOU[’']RE READY/g, " ")
      // The bullet glyph, which becomes a list item rather than a word.
      .replace(/\uf0b7/g, " ")
      .replace(/(?:^|\s)\d{1,3}(?=\s|$)/g, (m) => (Number(m.trim()) >= first && Number(m.trim()) <= last ? " " : m))
  );

  const missing = dropped(source, rendered);
  const total = source.split(" ").filter(Boolean).length;
  if (missing.length) {
    bad++;
    console.log(`  ch${String(n).padStart(2)}: ${missing.length} of ${total} words missing`);
    console.log(`        ${missing.slice(0, 16).join(" ")}`);
  } else {
    console.log(`  ch${String(n).padStart(2)}: all ${total} words carried through`);
  }
}
if (bad) {
  console.log("\n  Words are missing — see above.\n");
  process.exitCode = 1;
} else {
  console.log("\n  Every word of every chapter reaches the page.\n");
}
