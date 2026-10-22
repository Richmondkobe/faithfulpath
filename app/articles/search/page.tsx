import type { Metadata } from "next";
import Link from "next/link";
import { searchPublishedArticles } from "@/lib/articles-db";
import { normaliseQuery } from "@/lib/article-search";
import ArticleCards from "@/components/ArticleCards";
import ArticleSearch from "@/components/ArticleSearch";
import { TalkToPastor } from "@/components/ArticleIndex";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

/**
 * /articles/search?q=… — the search box's results.
 *
 * Kept out of search engines (an endless set of thin pages, one per search)
 * and out of the sitemap; the articles it lists are indexed in their own right.
 * A static segment, so it is matched before /articles/[slug].
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = normaliseQuery((await searchParams).q);
  return {
    title: q ? `Search: ${q}` : "Search articles",
    robots: { index: false, follow: true },
  };
}

export default async function ArticleSearchPage({ searchParams }: Props) {
  const q = normaliseQuery((await searchParams).q);
  const results = q ? await searchPublishedArticles(q) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
      <div className="max-w-3xl">
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Search articles
        </h1>

        <ArticleSearch q={q} />

        {q && (
          <p className="mt-8 text-[15px] text-navy" aria-live="polite">
            {results.length === 1 ? "1 article" : `${results.length} articles`} found for &ldquo;{q}&rdquo;
          </p>
        )}
      </div>

      {results.length > 0 ? (
        <ArticleCards articles={results} />
      ) : (
        <div className="mt-10 max-w-[40rem] leading-relaxed">
          <p>
            {q
              ? "Nothing matched that. Try a single word, or a different way of putting it."
              : "Type a word or phrase above to search every article."}
          </p>
          <p className="mt-4">
            <Link href="/articles" className="text-navy underline underline-offset-4">
              See all articles
            </Link>
            {", or if something is weighing on you, "}
            <Link href="/talk-to-a-pastor" className="text-navy underline underline-offset-4">
              talk to a pastor
            </Link>
            .
          </p>
        </div>
      )}

      <TalkToPastor />
    </main>
  );
}
