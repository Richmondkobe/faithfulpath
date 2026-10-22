import Link from "next/link";
import type { Article } from "@/lib/article";
import { SITE } from "@/lib/site";
import ArticlePagination from "@/components/ArticlePagination";
import ArticleCards from "@/components/ArticleCards";
import ArticleSearch from "@/components/ArticleSearch";
import CategoryRow from "@/components/CategoryRow";

/**
 * The articles index, shared by /articles, /articles/page/[page] and the
 * category routes, so none of them can drift apart. The articles show as
 * cards (components/ArticleCards), under the search box.
 */
export default function ArticleIndex({
  articles,
  page,
  pageCount,
  counts,
  heading = "Articles",
  lede = "Writing on faith, marriage, grief, and staying with God when it gets hard.",
  category,
  basePath = "/articles",
  empty = "Articles are on their way. In the meantime, if something is weighing on you, we can talk about it properly.",
}: {
  articles: Article[];
  page: number;
  pageCount: number;
  counts: Map<string, number>;
  heading?: string;
  lede?: string;
  /** Set on a category page, so the row marks it and paging stays inside it. */
  category?: string;
  basePath?: string;
  empty?: string;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
      <div className="max-w-3xl">
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {heading}
        </h1>
        <p
          className="mt-5 max-w-xl text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {lede}
        </p>

        <ArticleSearch />

        <CategoryRow counts={counts} active={category} />

        {/* Only from page two on: on page one it would be noise above the list. */}
        {pageCount > 1 && page > 1 && (
          <p className="mt-8 text-[13px] uppercase tracking-[0.12em] text-navy font-medium">
            Page {page} of {pageCount}
          </p>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="mt-14 max-w-[40rem] leading-relaxed text-muted">{empty}</p>
      ) : (
        <ArticleCards articles={articles} />
      )}

      <div className="max-w-3xl">
        <ArticlePagination page={page} pageCount={pageCount} basePath={basePath} />
      </div>

      <TalkToPastor />
    </main>
  );
}

/** The close of the index and the search page. */
export function TalkToPastor() {
  return (
    <div className="mt-16 max-w-3xl border-t border-line pt-10">
      <p
        className="text-xl leading-snug text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Reading only takes you so far.
      </p>
      <Link
        href="/talk-to-a-pastor"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-navy px-7 py-4 text-[15px] font-medium text-paper transition-colors hover:bg-navy"
      >
        Talk to a Pastor — {SITE.price}
      </Link>
    </div>
  );
}
