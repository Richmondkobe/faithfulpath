// The book categories, defined here rather than in the database.
//
// Mirrors lib/categories.ts for articles, and for the same reasons: the
// `products.category` column stores one of these slugs, and the label and the
// order they appear in come from this file. Renaming a category is then a code
// change, and a row carrying an unknown slug shows no label instead of
// breaking a page.
//
// Adding a category needs the check constraint in
// supabase/migrations/20261003160000_product_categories.sql widened too. That
// is deliberate: it makes a typo in the admin dropdown impossible.
//
// The order below is the order the filter buttons appear in, and the order the
// groups appear in under "All". It runs from the series that teaches the faith
// from the beginning, outward through the parts of life people write to me
// about, and ends with leading other people.

export type BookCategory = {
  slug: string;
  label: string;
};

export const BOOK_CATEGORIES: readonly BookCategory[] = [
  { slug: "following-jesus-series", label: "Following Jesus Series" },
  { slug: "dating-marriage-and-relationships", label: "Dating, Marriage & Relationships" },
  { slug: "rest-worry-and-renewal", label: "Rest, Worry & Renewal" },
  { slug: "church-leadership", label: "Church Leadership" },
] as const;

const BY_SLUG = new Map(BOOK_CATEGORIES.map((c) => [c.slug, c]));

/** The category for a slug, or null — including for a book with none set. */
export function getBookCategory(slug: string | null | undefined): BookCategory | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? null;
}

export function isBookCategorySlug(slug: string): boolean {
  return BY_SLUG.has(slug);
}

/**
 * The store, filtered to one category.
 *
 * A query string rather than a path, so /guides stays the one canonical URL
 * for the store and no book slug can ever collide with a route segment.
 */
export function bookCategoryHref(slug: string): string {
  return `/guides?category=${encodeURIComponent(slug)}`;
}
