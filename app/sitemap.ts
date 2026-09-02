import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listPublishedArticles } from "@/lib/articles-db";
import { listPublishedProducts } from "@/lib/products-db";

// The sitemap is a cached Route Handler, so without this it would only ever
// reflect the articles and guides that existed at build time. An hour is short
// enough that newly published work gets crawled promptly, and long enough that
// crawlers don't hit Supabase on every request.
export const revalidate = 3600;

// Everything a stranger should be able to find. Deliberately absent: the
// post-purchase page (already noindex), the admin area and its login, and the
// per-guide claim links, which are given out on purpose rather than crawled.
const STATIC_PATHS = [
  "",
  "/about",
  "/articles",
  "/guides",
  "/talk-to-a-pastor",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, guides] = await Promise.all([
    listPublishedArticles(),
    listPublishedProducts(),
  ]);

  const now = new Date();

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
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
