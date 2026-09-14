import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import {
  ARTICLES_PER_PAGE,
  articlesPageHref,
  countPublishedByCategory,
  listPublishedArticlePage,
  listPublishedArticles,
} from "@/lib/articles-db";
import { CATEGORIES, categoryHref } from "@/lib/categories";
import { listPublishedProducts } from "@/lib/products-db";

// The sitemap is a cached Route Handler, so without this it would only ever
// reflect the articles and guides that existed at build time. An hour is short
// enough that newly published work gets crawled promptly, and long enough that
// crawlers don't hit Supabase on every request.
export const revalidate = 3600;

// Everything a stranger should be able to find. Deliberately absent: the
// post-purchase page (already noindex), the admin area and its login, the
// per-guide claim links, which are given out on purpose rather than crawled,
// and the whole members area, which needs a paid sign-in and is noindex on
// every page.
//
// /membership belongs here: it is the public sales page for the course, and
// the only way in for someone who has not paid.
const STATIC_PATHS = [
  "",
  "/about",
  "/articles",
  "/guides",
  "/membership",
  "/talk-to-a-pastor",
  "/contact",
  "/before-you-say-yes/resources",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, guides, index, categoryCounts] = await Promise.all([
    listPublishedArticles(),
    listPublishedProducts(),
    listPublishedArticlePage(1),
    countPublishedByCategory(),
  ]);

  // Pages two and up of the articles index. Page one is already in
  // STATIC_PATHS as /articles, and each of these is its own canonical, so
  // listing them is what lets a crawler reach the older articles without
  // walking the Newer/Older links.
  const articlePages = Array.from(
    { length: Math.max(0, index.pageCount - 1) },
    (_, i) => articlesPageHref(i + 2)
  );

  // Category pages, and their own page two and up. A category with nothing in
  // it is left out: it renders, but an empty page is not worth crawling.
  const categoryPages = CATEGORIES.flatMap((category) => {
    const total = categoryCounts.get(category.slug) ?? 0;
    if (total === 0) return [];

    const pages = Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));
    return Array.from({ length: pages }, (_, i) => categoryHref(category.slug, i + 1));
  });

  const now = new Date();

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...categoryPages.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // A real way in for a reader who wants one topic, but still a route to
      // the writing rather than the writing itself.
      priority: 0.6,
    })),
    ...articlePages.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // Below /articles itself: these are routes to the writing, not the
      // writing, and page one is the one worth ranking.
      priority: 0.5,
    })),
    ...articles.map((a) => ({
      url: `${SITE.url}/articles/${a.slug}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...guides.map((g) => ({
      url: `${SITE.url}/guides/${g.slug}`,
      lastModified: new Date(g.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
