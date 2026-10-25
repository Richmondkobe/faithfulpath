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
import { publicSeriesPaths } from "@/lib/following-jesus";
import { LBYR_NEW_LIVE } from "@/lib/lbyr-new-live";

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
  // The page behind the menu's "Courses".
  "/courses",
  // Following Jesus: the series home and the Begin welcome page, the public
  // sales pages for the separately sold courses. Their lessons are not here.
  ...publicSeriesPaths(),
  // Lead Before You're Ready's Welcome page, its public way in. The rest of
  // the course is for members.
  ...(LBYR_NEW_LIVE ? ["/members/courses/lead-before-youre-ready-new/welcome"] : []),
  "/talk-to-a-pastor",
  // The free community's public welcome page. Its signed-in pages are not here.
  "/community",
  "/contact",
  "/help",
  "/videos",
  // How to add the site to a phone's home screen.
  "/install",
  // The legal pages. Crawlable on purpose: a reader deciding whether to buy
  // should be able to find the refund terms without being sold to first, and a
  // payment provider checking the site expects to reach them from a search.
  "/privacy",
  "/terms",
  "/pastoral-terms",
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

  // Dates only where they are true (website audit S7). A list of articles
  // changes when its newest article does; fixed pages and books have no
  // reliable "last changed" date, so they give none rather than "now", which
  // would teach search engines to ignore every date here. changeFrequency and
  // priority are left out: Google ignores both.
  const newest = (list: { updated_at: string }[]) =>
    list.length ? new Date(Math.max(...list.map((a) => Date.parse(a.updated_at)))) : undefined;
  const latestArticle = newest(articles);
  const latestIn = (slug: string) => newest(articles.filter((a) => a.category === slug));

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE.url}${path}`,
      ...(path === "/articles" && latestArticle ? { lastModified: latestArticle } : {}),
    })),
    ...categoryPages.map((path) => {
      const slug = path.split("/")[3];
      const lastModified = latestIn(slug);
      return { url: `${SITE.url}${path}`, ...(lastModified ? { lastModified } : {}) };
    }),
    ...articlePages.map((path) => ({
      url: `${SITE.url}${path}`,
      ...(latestArticle ? { lastModified: latestArticle } : {}),
    })),
    ...articles.map((a) => ({
      url: `${SITE.url}/articles/${a.slug}`,
      lastModified: new Date(a.updated_at),
    })),
    ...guides.map((g) => ({ url: `${SITE.url}/guides/${g.slug}` })),
  ];
}
