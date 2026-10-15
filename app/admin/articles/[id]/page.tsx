import { notFound } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import DeleteArticle from "@/components/admin/DeleteArticle";
import { getArticleById } from "@/lib/articles-db";
import { requireAdmin } from "@/lib/auth";

export default async function EditArticle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Checked here as well as in the layout: a layout does not stop its pages
  // rendering on their own, and these read with the service-role key.
  await requireAdmin();
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {article.title}
      </h1>
      <ArticleForm article={article} />
      <DeleteArticle id={article.id} title={article.title} />
    </main>
  );
}
