import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Article } from "@/lib/article";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listArticles(): Promise<Article[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load articles: ${error.message}`);
  return (data ?? []) as Article[];
}

export async function listPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Could not load articles: ${error.message}`);
  return (data ?? []) as Article[];
}

export async function getArticleById(id: string): Promise<Article | null> {
  // Postgres errors on a malformed uuid rather than returning no rows.
  if (!UUID.test(id)) return null;

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load article: ${error.message}`);
  return (data as Article) ?? null;
}

export async function getPublishedArticleBySlug(
  slug: string
): Promise<Article | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`Could not load article: ${error.message}`);
  return (data as Article) ?? null;
}
