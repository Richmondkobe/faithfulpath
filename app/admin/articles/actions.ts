"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/products";

export type ArticleFormState = { error: string | null };

export async function saveArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  // Server Actions are reachable by direct POST, so authorise here too.
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "").trim();
  const metaTitle = String(formData.get("meta_title") ?? "").trim();
  const metaDescription = String(formData.get("meta_description") ?? "").trim();
  const published = formData.get("published") === "on";

  if (!title) return { error: "Give the article a title." };
  if (!bodyMd) return { error: "The article has no body." };

  const slug = slugify(slugInput || title);
  if (!slug) {
    return { error: "That title does not make a usable slug — set one by hand." };
  }

  const fields: Record<string, unknown> = {
    slug,
    title,
    excerpt: excerpt || null,
    body_md: bodyMd,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    published,
    updated_at: new Date().toISOString(),
  };

  // Stamp published_at the first time it goes live, and leave it alone after
  // that so editing an old post does not reorder the index.
  if (published) {
    const existing = id
      ? (
          await supabaseAdmin
            .from("articles")
            .select("published_at")
            .eq("id", id)
            .maybeSingle()
        ).data?.published_at
      : null;

    if (!existing) fields.published_at = new Date().toISOString();
  }

  const previousSlug = id
    ? (
        await supabaseAdmin
          .from("articles")
          .select("slug")
          .eq("id", id)
          .maybeSingle()
      ).data?.slug
    : null;

  const { error } = id
    ? await supabaseAdmin.from("articles").update(fields).eq("id", id)
    : await supabaseAdmin.from("articles").insert(fields);

  if (error) {
    if (error.code === "23505") {
      return { error: `The slug "${slug}" is already in use.` };
    }
    return { error: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
  // A renamed slug leaves the old path cached; clear it too.
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/articles/${previousSlug}`);
  }

  redirect("/admin/articles");
}

export type DeleteArticleState = { error: string | null };

export async function deleteArticle(
  _prev: DeleteArticleState,
  formData: FormData
): Promise<DeleteArticleState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing article id." };

  const { data: article, error: loadError } = await supabaseAdmin
    .from("articles")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return { error: `Could not load article: ${loadError.message}` };
  }
  if (!article) return { error: "That article no longer exists." };

  const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
  if (error) return { error: `Could not delete: ${error.message}` };

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${article.slug}`);

  redirect("/admin/articles");
}
