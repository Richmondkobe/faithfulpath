import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Product } from "@/lib/products";

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data ?? []) as Product[];
}

export async function listPublishedProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load guides: ${error.message}`);
  return (data ?? []) as Product[];
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductById(id: string): Promise<Product | null> {
  // Postgres errors on a malformed uuid rather than returning no rows.
  if (!UUID.test(id)) return null;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load product: ${error.message}`);
  return (data as Product) ?? null;
}

export async function getPublishedProductBySlug(
  slug: string
): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`Could not load guide: ${error.message}`);
  return (data as Product) ?? null;
}
