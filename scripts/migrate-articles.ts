/**
 * One-off migration: the pre-Supabase hardcoded articles -> the `articles` table.
 * Source data is frozen in scripts/legacy-articles.ts.
 *
 *   npx tsx scripts/migrate-articles.ts
 *
 * Safe to run more than once — rows are upserted on `slug`, so slugs and
 * therefore URLs are preserved exactly and a second run updates rather than
 * duplicating. Pass --dry to print what would be written without touching the
 * database.
 */

import { loadEnvConfig } from "@next/env";
import type { Article, Block } from "../lib/types";

// Load .env.local the way Next does, before anything reads process.env.
loadEnvConfig(process.cwd());

const dryRun = process.argv.includes("--dry");

/** Block[] -> markdown, matching what components/ArticleBody.tsx parses back. */
function blocksToMarkdown(body: Block[]): string {
  return body
    .map((block) => {
      if ("h2" in block) return `## ${block.h2}`;
      if ("h3" in block) return `### ${block.h3}`;
      if ("list" in block) return block.list.map((i) => `- ${i}`).join("\n");
      return block.p;
    })
    .join("\n\n");
}

function rowFor(a: Article) {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.summary,
    body_md: blocksToMarkdown(a.body),
    meta_title: a.metaTitle,
    meta_description: a.metaDescription,
    published: true,
    published_at: `${a.isoDate}T00:00:00Z`,
  };
}

async function main() {
  // Imported after loadEnvConfig — the admin client throws at import time if
  // the service role key is missing.
  const { supabaseAdmin } = await import("../lib/supabase/admin");
  const { ALL_ARTICLES } = await import("./legacy-articles");

  console.log(
    `Found ${ALL_ARTICLES.length} articles in scripts/legacy-articles.ts\n`
  );

  // Fail early with a clear message if the meta_title column was never added.
  // A dry run carries on regardless, so the conversion can be checked first.
  const probe = await supabaseAdmin.from("articles").select("meta_title").limit(1);
  if (probe.error && /meta_title/.test(probe.error.message)) {
    const message =
      "The `meta_title` column is missing. Run this in the Supabase SQL editor first:\n\n" +
      "  alter table articles add column meta_title text;\n";

    if (!dryRun) {
      console.error(message);
      process.exit(1);
    }
    console.warn(`WARNING: ${message}`);
  }

  let written = 0;

  for (const article of ALL_ARTICLES) {
    const row = rowFor(article);
    const words = row.body_md.split(/\s+/).length;

    if (dryRun) {
      console.log(`[dry] ${row.slug}`);
      console.log(`      title:      ${row.title}`);
      console.log(`      meta_title: ${row.meta_title}`);
      console.log(`      published:  ${row.published_at}`);
      console.log(`      body:       ${words} words, ${row.body_md.length} chars\n`);
      continue;
    }

    const { error } = await supabaseAdmin
      .from("articles")
      .upsert(row, { onConflict: "slug" });

    if (error) {
      console.error(`FAILED ${row.slug}: ${error.message}`);
      process.exitCode = 1;
      continue;
    }

    written += 1;
    console.log(`ok  ${row.slug}  (${words} words)`);
  }

  if (dryRun) {
    console.log("Dry run — nothing was written.");
    return;
  }

  console.log(`\nWrote ${written}/${ALL_ARTICLES.length} articles.`);

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("slug, title, published, published_at")
    .order("published_at", { ascending: false });

  if (error) {
    console.error(`Could not read back: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nIn the table now:");
  for (const row of data ?? []) {
    console.log(
      `  ${row.published ? "published" : "draft    "}  ${row.slug}  (${String(
        row.published_at
      ).slice(0, 10)})`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
