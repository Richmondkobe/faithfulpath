import { supabaseAdmin } from "@/lib/supabase/admin";
import { listProducts } from "@/lib/products-db";
import type { Product, Purchase } from "@/lib/products";

/**
 * The books bought with an email address, for the "Your books" page
 * (/members/books). Read with the service role, as every purchase is, and
 * only ever for the signed-in person's own address: the page passes the
 * address from the verified session, never one from the request.
 *
 * Matched case-insensitively with the wildcards escaped, as lib/members.ts
 * does, so "a_b@example.com" cannot see "axb@example.com"'s books.
 */
const pattern = (email: string) => email.trim().replace(/([\\%_])/g, "\\$1");

export type OwnedBook = { purchase: Purchase; product: Product };

export async function booksForEmail(email: string): Promise<OwnedBook[]> {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .ilike("email", pattern(email))
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your books: ${error.message}`);
  const purchases = (data ?? []) as Purchase[];
  if (!purchases.length) return [];
  const products = new Map((await listProducts()).map((p) => [p.id, p]));
  // One entry per book: the newest purchase of it.
  const seen = new Set<string>();
  const out: OwnedBook[] = [];
  for (const purchase of purchases) {
    const product = products.get(purchase.product_id);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    out.push({ purchase, product });
  }
  return out;
}

export async function hasBooks(email: string): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .ilike("email", pattern(email));
  if (error) throw new Error(`Could not check your books: ${error.message}`);
  return Boolean(count);
}
