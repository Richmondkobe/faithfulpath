// Pure helpers for the article search — safe to import anywhere. The query
// itself is searchPublishedArticles() in lib/articles-db.ts.

/** The longest search kept; anything past it is cut off. */
export const SEARCH_MAX_LENGTH = 100;

/** At most this many separate words or phrases are matched. */
const MAX_TERMS = 8;

/** The search text as typed, tidied: no control characters, single spaces, capped. */
export function normaliseQuery(raw: string | string[] | undefined): string {
  const q = Array.isArray(raw) ? raw[0] : raw;
  return (q ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_MAX_LENGTH)
    .trim();
}

/**
 * The words and "quoted phrases" in a search, each of which an article must
 * contain. Unquoted, "spiritual gates" is two words, and articles with the
 * exact phrase are ranked first (searchPublishedArticles); in quotes it is one
 * phrase.
 */
export function searchTerms(q: string): string[] {
  const terms: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  for (const m of q.matchAll(re)) {
    // * is PostgREST's own wildcard, so it is treated as a space.
    const t = (m[1] ?? m[2]).replace(/[*"]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    if (t && !terms.includes(t)) terms.push(t);
  }
  return terms.slice(0, MAX_TERMS);
}

/** The search as one phrase, for ranking: the text without its quotes. */
export function searchPhrase(q: string): string {
  return q.replace(/[*"]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * An ilike pattern matching `term` anywhere, with the characters LIKE treats
 * specially (\ % _) escaped, so the text is matched as written. The value is
 * sent as one filter value, never spliced into a filter string, so it cannot
 * add a filter of its own.
 */
export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}
