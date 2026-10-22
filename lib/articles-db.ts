import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Article } from "@/lib/article";
import { containsPattern, searchPhrase, searchTerms } from "@/lib/article-search";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listArticles(): Promise<Article[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load articles: ${error.message}`);
  return (data ?? []) as Article[];
}

/** How many articles one page of the index shows. */
export const ARTICLES_PER_PAGE = 12;

/**
 * Newest first, with created_at and id behind published_at as tiebreakers.
 *
 * The tiebreakers are what make the order total rather than merely mostly
 * decided. Two articles published on the same date used to be free to swap
 * places between one query and the next, which was invisible on a single list
 * and would not be once that list is cut into pages: a row could show on both
 * page one and page two, or on neither.
 */
function publishedNewestFirst(category?: string) {
  const base = supabaseAdmin
    .from("articles")
    .select("*", { count: "exact" })
    .eq("published", true);

  return (category ? base.eq("category", category) : base)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
}

/**
 * True when Postgres does not have the category column yet.
 *
 * The column arrives by migration, which is applied by hand. Between a deploy
 * and that migration every category query would otherwise 500 the page; this
 * lets those reads come back empty instead, so /articles and the article pages
 * carry on working and only the category pages are bare.
 */
function isMissingCategoryColumn(error: { code?: string; message?: string }): boolean {
  return error.code === "42703" && (error.message ?? "").includes("category");
}

export async function listPublishedArticles(): Promise<Article[]> {
  const { data, error } = await publishedNewestFirst();

  if (error) throw new Error(`Could not load articles: ${error.message}`);
  return (data ?? []) as Article[];
}

export type ArticlePage = {
  articles: Article[];
  /** Every published article, not just this page. */
  total: number;
  pageCount: number;
};

/**
 * One page of the index. Asks Postgres for the slice and the total count in a
 * single query, so adding articles never makes this read more rows.
 *
 * A page past the end comes back empty with the real pageCount, leaving the
 * route to decide — which it does by 404ing rather than showing a blank list.
 */
export async function listPublishedArticlePage(
  page: number,
  category?: string
): Promise<ArticlePage> {
  const from = (page - 1) * ARTICLES_PER_PAGE;
  const { data, error, count } = await publishedNewestFirst(category).range(
    from,
    from + ARTICLES_PER_PAGE - 1
  );

  if (error) {
    if (isMissingCategoryColumn(error)) {
      return { articles: [], total: 0, pageCount: 1 };
    }
    // PostgREST answers 416 PGRST103 when the offset is past the last row,
    // which is what /articles/page/99 asks for. That is a page that does not
    // exist, not a failure — report it empty and let the route 404. The count
    // does not survive the error, so it costs one cheap head query.
    if (error.code === "PGRST103") {
      return { ...(await countPublishedArticles(category)), articles: [] };
    }
    throw new Error(`Could not load articles: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    articles: (data ?? []) as Article[],
    total,
    // An empty index is still one page — the one that explains it is empty.
    pageCount: Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE)),
  };
}

/** Just the total, for the rare page that asks beyond the end. */
async function countPublishedArticles(
  category?: string
): Promise<{ total: number; pageCount: number }> {
  const base = supabaseAdmin
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  const { count, error } = await (category ? base.eq("category", category) : base);

  if (error) {
    if (isMissingCategoryColumn(error)) return { total: 0, pageCount: 1 };
    throw new Error(`Could not count articles: ${error.message}`);
  }

  const total = count ?? 0;
  return { total, pageCount: Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE)) };
}

/**
 * How many published articles each category holds, keyed by slug.
 *
 * One read of every published row rather than a query per category: there are
 * six of those and the index page wants all six counts at once. Rows with no
 * category, or one no longer in lib/categories.ts, are simply not counted.
 */
export async function countPublishedByCategory(): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("category")
    .eq("published", true);

  if (error) {
    if (isMissingCategoryColumn(error)) return new Map();
    throw new Error(`Could not count categories: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { category: string | null }[]) {
    if (!row.category) continue;
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  }
  return counts;
}

/** Where a page of the index lives. Page one is /articles, not /articles/page/1. */
export function articlesPageHref(page: number): string {
  return page <= 1 ? "/articles" : `/articles/page/${page}`;
}

export async function getArticleById(id: string): Promise<Article | null> {
  // Postgres errors on a malformed uuid rather than returning no rows.
  if (!UUID.test(id)) return null;

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load article: ${error.message}`);
  return (data as Article) ?? null;
}

export async function getPublishedArticleBySlug(
  slug: string
): Promise<Article | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`Could not load article: ${error.message}`);
  return (data as Article) ?? null;
}

export type ArticleCard = Pick<
  Article,
  "id" | "slug" | "title" | "excerpt" | "published_at" | "category" | "created_at"
>;

/** The most results one search shows. */
const SEARCH_LIMIT = 100;

/**
 * Published articles containing every word or "quoted phrase" of the search,
 * in the title, the excerpt or the body, ignoring case. Title matches come
 * first (the whole search as a phrase, then every word), then articles with
 * the whole phrase in the excerpt or body, then the rest; newest first within
 * each.
 *
 * Each word is its own ilike filter value (escaped by containsPattern), never
 * part of a hand-built filter string, so the search text cannot change the
 * query. One query per column, since a word may be in any of them; the body is
 * matched in Postgres and never sent back.
 */
export async function searchPublishedArticles(q: string): Promise<ArticleCard[]> {
  const terms = searchTerms(q);
  if (terms.length === 0) return [];
  const phrase = searchPhrase(q);
  const columns = "id, slug, title, excerpt, published_at, category, created_at";

  const matching = (column: "title" | "excerpt" | "body_md", words: string[], select: string) =>
    words
      .reduce(
        (query, w) => query.ilike(column, containsPattern(w)),
        supabaseAdmin.from("articles").select(select).eq("published", true)
      )
      .limit(SEARCH_LIMIT);

  const [inTitle, inExcerpt, inBody, phraseInBody] = await Promise.all([
    matching("title", terms, columns),
    matching("excerpt", terms, columns),
    matching("body_md", terms, columns),
    // Only worth asking when the search is more than one term.
    terms.length > 1 ? matching("body_md", [phrase], "id") : null,
  ]);

  for (const r of [inTitle, inExcerpt, inBody, phraseInBody]) {
    if (r?.error) throw new Error(`Could not search articles: ${r.error.message}`);
  }

  const found = new Map<string, ArticleCard>();
  for (const r of [inTitle, inExcerpt, inBody]) {
    for (const a of (r.data ?? []) as unknown as ArticleCard[]) found.set(a.id, a);
  }
  const bodyPhrase = new Set(((phraseInBody?.data ?? []) as unknown as { id: string }[]).map((a) => a.id));

  const rank = (a: ArticleCard) => {
    const title = a.title.toLowerCase();
    if (title.includes(phrase)) return 0;
    if (terms.every((t) => title.includes(t))) return 1;
    if ((a.excerpt ?? "").toLowerCase().includes(phrase) || bodyPhrase.has(a.id) || terms.length === 1) return 2;
    return 3;
  };
  const time = (a: ArticleCard) => (a.published_at ? Date.parse(a.published_at) : 0);

  return [...found.values()]
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        time(b) - time(a) ||
        Date.parse(b.created_at) - Date.parse(a.created_at) ||
        b.id.localeCompare(a.id)
    )
    .slice(0, SEARCH_LIMIT);
}
