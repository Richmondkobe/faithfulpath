import Link from "next/link";
import { displayDate } from "@/lib/article";
import type { Article } from "@/lib/article";
import { getCategory } from "@/lib/categories";
import { SITE } from "@/lib/site";
import ArticlePagination from "@/components/ArticlePagination";
import CategoryRow from "@/components/CategoryRow";

/**
 * The articles index, shared by /articles, /articles/page/[page] and the
 * category routes, so none of them can drift apart. The cards are unchanged
 * apart from the category label beside the date.
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
    <main className="mx-auto max-w-5xl px-6 [&>*]:max-w-3xl [&_p]:max-w-[40rem] pt-16 pb-20 sm:pt-24">
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

      <CategoryRow counts={counts} active={category} />

      {/* Only from page two on: on page one it would be noise above the list. */}
      {pageCount > 1 && page > 1 && (
        <p className="mt-8 text-[13px] uppercase tracking-[0.12em] text-navy font-medium">
          Page {page} of {pageCount}
        </p>
      )}

      {articles.length === 0 ? (
        <p className="mt-14 leading-relaxed text-muted">{empty}</p>
      ) : (
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {articles.map((a) => {
            const cat = getCategory(a.category);
            return (
              <li key={a.slug} className="py-8">
                <Link href={"/articles/" + a.slug} className="group block">
                  <p className="text-[13px] uppercase tracking-[0.12em] text-navy font-medium">
                    {displayDate(a.published_at)}
                    {/* Plain text inside the card: a link within a link is not
                        valid markup, so the label routes to the category only
                        from the article page itself. */}
                    {cat && (
                      <>
                        <span aria-hidden="true"> · </span>
                        {cat.label}
                      </>
                    )}
                  </p>
                  <h2
                    className="mt-2 text-2xl text-navy transition-colors group-hover:text-navy"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                  >
                    {a.title}
                  </h2>
                  <p className="mt-2 leading-relaxed">{a.excerpt}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ArticlePagination page={page} pageCount={pageCount} basePath={basePath} />

      <div className="mt-16 border-t border-line pt-10">
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
    </main>
  );
}
