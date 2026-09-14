import type { Metadata } from "next";
import {
  countPublishedByCategory,
  listPublishedArticlePage,
} from "@/lib/articles-db";
import ArticleIndex from "@/components/ArticleIndex";

// Saving in the admin calls revalidatePath("/articles"); this is the backstop
// for rows edited directly in Supabase.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Articles | Faithful Path Community",
  description:
    "Writing and teaching on faith, marriage, grief, and staying with God when it is hard.",
  // Page one of the index is /articles, never /articles/page/1 — which
  // redirects here rather than existing as a second copy of this page.
  alternates: { canonical: "/articles" },
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
