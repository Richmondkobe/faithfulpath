import type { Metadata } from "next";
import { socialMeta } from "@/lib/social-meta";
import {
  countPublishedByCategory,
  listPublishedArticlePage,
} from "@/lib/articles-db";
import ArticleIndex from "@/components/ArticleIndex";

// Saving in the admin calls revalidatePath("/articles"); this is the backstop
// for rows edited directly in Supabase.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Christian Articles on Faith and Life",
  description:
    "Christian articles from a pastor of twenty years on faith, prayer, worry, dating, marriage, rest and church leadership, rooted in Scripture.",
  // Page one of the index is /articles, never /articles/page/1 — which
  // redirects here rather than existing as a second copy of this page.
  alternates: { canonical: "/articles" },
  ...socialMeta({
    title: "Articles — Faithful Path Community",
    description: "Christian articles from a pastor of twenty years on faith, prayer, worry, dating, marriage, rest and church leadership, rooted in Scripture.",
    path: "/articles",
  }),
};

export default async function Articles() {
  const [{ articles, pageCount }, counts] = await Promise.all([
    listPublishedArticlePage(1),
    countPublishedByCategory(),
  ]);

  return (
    <ArticleIndex
      articles={articles}
      page={1}
      pageCount={pageCount}
      counts={counts}
    />
  );
}
