#!/usr/bin/env node
//
// One-off (17 October 2026): puts the 17 old Zyro articles in
// content/restored-articles/ back on the site as published articles.
//
//   node --env-file=.env.local scripts/restore-zyro-articles.mjs          # insert
//   node --env-file=.env.local scripts/restore-zyro-articles.mjs --check  # report only
//
// Adds rows only. A slug that is already in the articles table is skipped and
// reported, never updated.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DIR = "content/restored-articles";
const check = process.argv.includes("--check");
const manifest = JSON.parse(readFileSync(join(DIR, "manifest.json"), "utf8"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const slugs = manifest.articles.map((a) => a.slug);
const { data: existing, error } = await supabase
  .from("articles")
  .select("slug")
  .in("slug", slugs);
if (error) {
  console.error(`Could not read articles: ${error.message}`);
  process.exit(1);
}
const taken = new Set(existing.map((r) => r.slug));

const skipped = [];
const inserted = [];
for (const a of manifest.articles) {
  if (taken.has(a.slug)) {
    skipped.push(a.slug);
    continue;
  }
  const row = {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || null,
    body_md: readFileSync(join(DIR, a.body_file), "utf8").trim(),
    meta_title: a.meta_title || null,
    meta_description: a.meta_description || null,
    category: a.category ?? null,
    published: true,
    published_at: new Date(`${a.published_at}T12:00:00Z`).toISOString(),
  };
  if (check) {
    inserted.push(a.slug);
    continue;
  }
  const { error: insertError } = await supabase.from("articles").insert(row);
  if (insertError) {
    console.error(`  ${a.slug}: ${insertError.message}`);
    process.exit(1);
  }
  inserted.push(a.slug);
}

console.log(`\n  ${check ? "Would insert" : "Inserted"} ${inserted.length}:`);
for (const s of inserted) console.log(`    ${s}`);
console.log(`\n  Skipped (slug already exists) ${skipped.length}:`);
for (const s of skipped) console.log(`    ${s}`);
console.log();
