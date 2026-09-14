import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  countPublishedByCategory,
  listPublishedArticlePage,
} from "@/lib/articles-db";
import { CATEGORIES, categoryHref, getCategory } from "@/lib/categories";
import ArticleIndex from "@/components/ArticleIndex";

export const revalidate = 300;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return { title: "Not found | Faithful Path Community" };

  return {
    title: `${category.label} | Faithful Path Community`,
    description: category.description,
    alternates: { canonical: categoryHref(category.slug) },
  };
}

/**
 * Every category is prerendered, including one that is currently empty — the
 * page explains itself rather than 404ing, since the category is a real part of
 * the site whose first article may land at any time.
 */
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const category = getCategory((await params).category);
  // A slug that is not one of ours is not a category, whatever the database
  // happens to hold.
  if (!category) notFound();

  const [{ articles, pageCount }, counts] = await Promise.all([
    listPublishedArticlePage(1, category.slug),
    countPublishedByCategory(),
  ]);

  return (
    <ArticleIndex
      articles={articles}
      page={1}
      pageCount={pageCount}
      counts={counts}
      heading={category.label}
      lede={category.description}
      category={category.slug}
      basePath={categoryHref(category.slug)}
      empty="Nothing here yet. The writing on this topic is on its way."
    />
  );
}
