// Types and pure helpers only — safe to import from Client Components.
// Anything that talks to the database lives in lib/products-db.ts, which pulls
// in the service role key and must stay server-side.

export type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price_cents: number;
  cover_path: string | null;
  pdf_path: string | null;
  published: boolean;
  created_at: string;
};

export type Purchase = {
  id: string;
  product_id: string;
  email: string | null;
  amount_cents: number;
  stripe_session_id: string;
  download_token: string;
  download_count: number;
  created_at: string;
};

export function formatPrice(cents: number): string {
  return `US$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
