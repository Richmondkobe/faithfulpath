import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unstable_cache } from "next/cache";

/**
 * Faithful Path Daily Devotional (Richmond, 16 November 2026).
 *
 * The devotions live in content/devotions.json: a title, a Scripture
 * reference, the reflection, a prayer and a question. Each was reviewed by
 * Richmond and his reviewer before it went in; nothing here is written by
 * the site. The file holds the reference only, never the Bible text: the
 * ESV wording is fetched from api.esv.org with ESV_API_KEY and cached for 30
 * days. Without the key, or if the fetch fails, the devotional is still
 * shown, with the reference and an invitation to read it in a Bible.
 *
 * Day 1 is DEVOTIONAL_START. A new day begins at 05:00 UTC, which is
 * midnight on the US east coast, early morning in Europe and midday in
 * Bangkok. After the last devotion the series starts again from Day 1 until
 * more are added to the file.
 */

export const DEVOTIONAL_NAME = "Faithful Path Daily Devotional";

/** The first day (UTC date on which Day 1 is shown, from 05:00 UTC). */
export const DEVOTIONAL_START = "2026-11-16";
const DAY_STARTS_UTC_HOUR = 5;

export type Devotion = { day: number; title: string; ref: string; body: string; prayer: string; question: string };

const DEVOTIONS: Devotion[] = JSON.parse(
  readFileSync(join(process.cwd(), "content", "devotions.json"), "utf8")
).devotions;

export const ESV_SHORT_NOTICE =
  "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.";

export { REFLECTION_MAX, type Reflection } from "@/lib/devotional-shared";

/** Days since the series began (0 on the first day), or null before it has. */
export function devotionalSeq(now = Date.now()): number | null {
  const start = Date.parse(`${DEVOTIONAL_START}T00:00:00Z`) + DAY_STARTS_UTC_HOUR * 3_600_000;
  if (DEVOTIONS.length === 0 || now < start) return null;
  return Math.floor((now - start) / 86_400_000);
}

/** The devotion shown on a given day of the series; the series repeats after the last one. */
export function devotionAt(seq: number): Devotion {
  return DEVOTIONS[seq % DEVOTIONS.length];
}

/** Today's devotion, or null before the series has begun. */
export function devotionFor(now = Date.now()): Devotion | null {
  const seq = devotionalSeq(now);
  return seq === null ? null : devotionAt(seq);
}

const fetchEsv = unstable_cache(
  async (ref: string): Promise<string> => {
    const key = process.env.ESV_API_KEY;
    if (!key) throw new Error("ESV_API_KEY is not set.");
    const q = new URLSearchParams({
      q: ref,
      "include-passage-references": "false",
      "include-verse-numbers": "false",
      "include-first-verse-numbers": "false",
      "include-footnotes": "false",
      "include-footnote-body": "false",
      "include-headings": "false",
      "include-short-copyright": "false",
      "include-copyright": "false",
      "include-selahs": "true",
      "indent-paragraphs": "0",
      "indent-poetry": "false",
      "indent-declares": "0",
      "indent-psalm-doxology": "0",
    });
    const res = await fetch(`https://api.esv.org/v3/passage/text/?${q}`, {
      headers: { Authorization: `Token ${key}` },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ESV API ${res.status}`);
    const json = (await res.json()) as { passages?: string[] };
    const text = (json.passages ?? []).join(" ").replace(/\s+/g, " ").trim();
    if (!text) throw new Error(`ESV API returned no text for ${ref}`);
    return text;
  },
  ["esv-devotional-passage-v1"],
  { revalidate: 60 * 60 * 24 * 30 }
);

/** The ESV wording for a reference, or null when it cannot be had (a failure is not cached). */
export async function esvText(ref: string): Promise<string | null> {
  if (!process.env.ESV_API_KEY) return null;
  try {
    // The API takes a plain hyphen in a verse range.
    return await fetchEsv(ref.replace(/–/g, "-"));
  } catch (err) {
    console.error(`Daily devotional: no ESV text for ${ref}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
