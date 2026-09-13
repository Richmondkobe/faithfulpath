import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Article } from "@/lib/article";

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
function publishedNewestFirst() {
  return supabaseAdmin
    .from("articles")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
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
export async function listPublishedArticlePage(page: number): Promise<ArticlePage> {
  const from = (page - 1) * ARTICLES_PER_PAGE;
  const { data, error, count } = await publishedNewestFirst().range(
    from,
    from + ARTICLES_PER_PAGE - 1
  );

  if (error) {
    // PostgREST answers 416 PGRST103 when the offset is past the last row,
    // which is what /articles/page/99 asks for. That is a page that does not
    // exist, not a failure — report it empty and let the route 404. The count
    // does not survive the error, so it costs one cheap head query.
    if (error.code === "PGRST103") {
      return { ...(await countPublishedArticles()), articles: [] };
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
async function countPublishedArticles(): Promise<{ total: number; pageCount: number }> {
  const { count, error } = await supabaseAdmin
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  if (error) throw new Error(`Could not count articles: ${error.message}`);

  const total = count ?? 0;
  return { total, pageCount: Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE)) };
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
