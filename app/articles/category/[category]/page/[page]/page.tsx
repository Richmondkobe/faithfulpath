import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  countPublishedByCategory,
  listPublishedArticlePage,
} from "@/lib/articles-db";
import { CATEGORIES, categoryHref, getCategory } from "@/lib/categories";
import ArticleIndex from "@/components/ArticleIndex";

export const revalidate = 300;

type Props = { params: Promise<{ category: string; page: string }> };

/**
 * Pages two and up within one category. Same rules as /articles/page/[page]:
 * one spelling per page, page one lives at the base path, past the end is a 404.
 */
function parsePage(raw: string): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) ? page : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug, page: rawPage } = await params;
  const category = getCategory(slug);
  const page = parsePage(rawPage);
  if (!category || page === null) {
    return { title: "Not found | Faithful Path Community" };
  }

  return {
    title: `${category.label} — page ${page} | Faithful Path Community`,
    description: category.description,
    alternates: { canonical: categoryHref(category.slug, page) },
  };
}

/**
 * Prerender the category pages that exist at build time. dynamicParams stays
 * on, so a page that appears as a category fills up renders on first request.
 */
export async function generateStaticParams() {
  const params: { category: string; page: string }[] = [];

  for (const category of CATEGORIES) {
    const { pageCount } = await listPublishedArticlePage(1, category.slug);
    for (let page = 2; page <= pageCount; page++) {
      params.push({ category: category.slug, page: String(page) });
    }
  }

  return params;
}

export default async function CategoryPagePaged({ params }: Props) {
  const { category: slug, page: rawPage } = await params;

  const category = getCategory(slug);
  if (!category) notFound();

  const page = parsePage(rawPage);
  if (page === null) notFound();
  if (page === 1) redirect(categoryHref(category.slug));

  const [{ articles, pageCount }, counts] = await Promise.all([
    listPublishedArticlePage(page, category.slug),
    countPublishedByCategory(),
  ]);

  if (articles.length === 0) notFound();

  return (
    <ArticleIndex
      articles={articles}
      page={page}
      pageCount={pageCount}
      counts={counts}
      heading={category.label}
      lede={category.description}
      category={category.slug}
      basePath={categoryHref(category.slug)}
    />
  );
}
