import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unstable_cache } from "next/cache";

/**
 * Verse of the day for the community home (Richmond, 26 October 2026).
 *
 * The references live in content/verses.json, one per date (01-01 to 12-31,
 * 29 February included), so they can be changed with an ordinary edit. The
 * wording is the ESV, fetched from api.esv.org with ESV_API_KEY and cached
 * for 30 days per reference, so a page view never waits on the API. A fetch
 * that fails is not cached (it throws), and that day falls back to the
 * previous day's verse, so a verse is never shown without its text.
 *
 * The day changes at midnight in the visitor's own time zone. The server does
 * not know that zone, so it sends the verses for yesterday, today and
 * tomorrow in UTC, which covers every time zone on Earth, and the card picks
 * the visitor's own date in the browser (components/community/VerseOfTheDay).
 */

type Entry = { date: string; ref: string; theme: string };
const VERSES: Entry[] = JSON.parse(readFileSync(join(process.cwd(), "content", "verses.json"), "utf8")).verses;
const BY_DATE = new Map(VERSES.map((v) => [v.date, v.ref]));

export const ESV_NOTICE =
  "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated in whole or in part into any other language.";

/** The reference for a date: "MM-DD". In a year without 29 February that entry is simply never reached. */
export function refForDate(ymd: string): string | null {
  return BY_DATE.get(ymd.slice(5)) ?? null;
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
  ["esv-passage-v1"],
  { revalidate: 60 * 60 * 24 * 30 }
);

async function textFor(ref: string): Promise<string | null> {
  try {
    return await fetchEsv(ref);
  } catch (err) {
    console.error(`Verse of the day: no ESV text for ${ref}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export type DayVerse = { date: string; ref: string; text: string };

const ymdUtc = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * A date's verse, or, if its text cannot be had, the previous day's (looking
 * back up to a week). Null only if none of them can be fetched.
 */
async function verseFor(ymd: string): Promise<DayVerse | null> {
  const day = Date.parse(`${ymd}T00:00:00Z`);
  for (let back = 0; back < 7; back++) {
    const ref = refForDate(ymdUtc(day - back * 86_400_000));
    if (!ref) continue;
    const text = await textFor(ref);
    if (text) return { date: ymd, ref, text };
  }
  return null;
}

/** Yesterday, today and tomorrow (UTC): every visitor's local date is one of these. */
export async function versesAroundToday(now = Date.now()): Promise<DayVerse[]> {
  const days = [-1, 0, 1].map((d) => ymdUtc(now + d * 86_400_000));
  return (await Promise.all(days.map(verseFor))).filter((v): v is DayVerse => v !== null);
}
