// Types and pure helpers for articles — safe to import from Client Components.
// Queries live in lib/articles-db.ts, which pulls in the service role key.
// (Singular filename: lib/articles.ts is the legacy hardcoded content.)

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** "August 2026" — the human-facing date the articles have always shown. */
export function displayDate(published_at: string | null): string {
  if (!published_at) return "";
  const d = new Date(published_at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-08-23" — the machine-readable date used in the Article JSON-LD. */
export function isoDay(published_at: string | null): string {
  if (!published_at) return "";
  const d = new Date(published_at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
