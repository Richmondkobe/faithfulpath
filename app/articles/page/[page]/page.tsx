import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  articlesPageHref,
  countPublishedByCategory,
  listPublishedArticlePage,
} from "@/lib/articles-db";
import ArticleIndex from "@/components/ArticleIndex";

export const revalidate = 300;

type Props = { params: Promise<{ page: string }> };

/**
 * Pages two and up of the articles index.
 *
 * This sits at /articles/page/[page], two segments deep, so it cannot collide
 * with /articles/[slug] — and no article may use the slug "page" anyway, since
 * that single-segment URL still belongs to the article route.
 */

/** The page number, or null for anything that is not a plain number above one. */
function parsePage(raw: string): number | null {
  // No leading zeros, no "2.0", no "+2": one spelling per page, so the same
  // list can never be reached at two different URLs.
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) ? page : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page);
  if (page === null) return { title: "Not found | Faithful Path Community" };

  return {
    title: `Articles — page ${page} | Faithful Path Community`,
    description:
      "Writing and teaching on faith, marriage, grief, and staying with God when it is hard.",
    // Each page is its own canonical. Pointing them all at /articles would be
    // telling Google that pages two and up are duplicates, which is how their
    // articles stop being indexed.
    alternates: { canonical: articlesPageHref(page) },
  };
}

/**
 * Prerender the pages that exist at build time. dynamicParams stays on, so a
 * page that appears later is rendered on first request and then cached like
 * the rest.
 */
export async function generateStaticParams() {
  const { pageCount } = await listPublishedArticlePage(1);
  return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export default async function ArticlesPage({ params }: Props) {
  const page = parsePage((await params).page);
  if (page === null) notFound();

  // One list, one URL: page one lives at /articles.
  if (page === 1) redirect("/articles");

  const [{ articles, pageCount }, counts] = await Promise.all([
    listPublishedArticlePage(page),
    countPublishedByCategory(),
  ]);

  // Past the end. 404 rather than an empty list, so a stale link or a crawler
  // guessing at /articles/page/99 is told plainly that there is nothing there.
  if (articles.length === 0) notFound();

  return (
    <ArticleIndex
      articles={articles}
      page={page}
      pageCount={pageCount}
      counts={counts}
    />
  );
}
