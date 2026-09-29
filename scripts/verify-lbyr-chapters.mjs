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

/** Words one side has and the other does not, counting repeats. */
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

/**
 * Words the page has that the book does not.
 *
 * Checked in both directions, because one direction is blind to a missing
 * space. "Someone asked you to lead.Maybe" loses two of the book's words and
 * gains one of its own — and if "lead." and "Maybe" appear anywhere else in the
 * chapter, the counts still balance and nothing is reported. That is exactly
 * what happened: every bold lead-in on all ten chapters ran into the sentence
 * after it, and a one-way count called it perfect.
 */
const invented = (src, out) => dropped(out, src);

/** The chapter titles as the book's contents page gives them. */
const contents = new Map();
for (const m of text[2].replace(/\s+/g, " ").matchAll(/(\d+)\.\s*([^.]+?)\.{3,}\s*\d+/g)) {
  contents.set(Number(m[1]), m[2].trim());
}
if (contents.size !== 10) {
  console.error(`\n  The contents page yielded ${contents.size} chapter titles, not 10.\n`);
  process.exitCode = 1;
}

console.log();
let bad = 0;
for (let n = 1; n <= 10; n++) {
  const path = join(ROOT, `lesson-${String(n).padStart(2, "0")}`, "chapter.json");
  const doc = JSON.parse(readFileSync(path, "utf8"));
  const [first, last] = doc.pages;

  // Exactly as the page builds it, in two respects. Runs are concatenated with
  // nothing between them, because that is what React does with adjacent spans —
  // joining them with a space here was why a missing one went unseen. And the
  // page renders the FIRST title block and then every non-title block, so a
  // second title block is not rendered at all. Both of those were bugs this
  // check called perfect: a lost space, then a chapter title cut in half.
  const title = doc.blocks.find((b) => b.t === "title");
  const shown = [...(title ? [title] : []), ...doc.blocks.filter((b) => b.t !== "title")];
  const rendered = norm(shown.map((b) => b.c.map((r) => r.text).join("")).join(" "));
  // Page by page, so the page number is removed where it actually sits — at the
  // foot — rather than anywhere that number happens to appear. Stripping every
  // matching number also removed real ones from the prose, which then read as
  // words the page had invented.
  const source = norm(
    Array.from({ length: last - first + 1 }, (_, k) => {
      const pageNumber = first + k;
      return text[pageNumber - 1]
        .replace(/LEAD BEFORE YOU[’']RE READY/g, " ")
        // The bullet glyph, which becomes a list item rather than a word.
        .replace(/\uf0b7/g, " ")
        // The page number, at the foot of the page.
        .replace(new RegExp(`\\s${pageNumber}\\s*$`), " ");
    }).join(" ")
  );

  // The title the page will show, against the book's contents page. A title
  // that wrapped onto a second line used to arrive as two blocks, and the page
  // showed only the first — "Running a Meeting People Want to", without
  // "Attend". Nothing in a word count notices that.
  const shownTitle = norm(title ? title.c.map((r) => r.text).join("") : "");
  const expected = norm(`Chapter ${n} \u2013 ${contents.get(n) ?? ""}`);
  if (shownTitle !== expected) {
    bad++;
    console.log(`  ch${String(n).padStart(2)}: title does not match the contents page`);
    console.log(`        page:     "${shownTitle}"`);
    console.log(`        contents: "${expected}"`);
    continue;
  }

  // No block may begin mid-sentence. A hanging-indent continuation read as a
  // new paragraph split a list item in two — "agree a follow-up" ended the
  // bullet and "rather than assuming everyone can stay." became a paragraph of
  // its own. A word count cannot see that, because every word is still there.
  const midSentence = shown
    .map((b, k) => ({ k, t: b.t, text: b.c.map((r) => r.text).join("").trim() }))
    .filter((b) => /^[a-z]/.test(b.text));
  if (midSentence.length) {
    bad++;
    console.log(`  ch${String(n).padStart(2)}: ${midSentence.length} block(s) begin mid-sentence`);
    for (const b of midSentence.slice(0, 3)) {
      console.log(`        block ${b.k} (${b.t}): "${b.text.slice(0, 70)}"`);
    }
    continue;
  }

  const missing = dropped(source, rendered);
  const extra = invented(source, rendered);
  const total = source.split(" ").filter(Boolean).length;
  if (missing.length || extra.length) {
    bad++;
    console.log(`  ch${String(n).padStart(2)}: ${missing.length} missing, ${extra.length} invented, of ${total} words`);
    if (missing.length) console.log(`        missing:  ${missing.slice(0, 10).join(" ")}`);
    if (extra.length) console.log(`        invented: ${extra.slice(0, 10).join(" ")}`);
  } else {
    console.log(`  ch${String(n).padStart(2)}: all ${total} words carried through, none invented`);
  }
}
if (bad) {
  console.log("\n  Words are missing — see above.\n");
  process.exitCode = 1;
} else {
  console.log("\n  Every word of every chapter reaches the page.\n");
}
