// The article categories, defined here rather than in the database.
//
// The `articles.category` column stores one of these slugs; everything a reader
// sees — the label, the order they appear in, the sentence under the heading —
// comes from this file. That keeps renaming a category a code change rather
// than a data migration, and means a row carrying an unknown slug simply shows
// no label instead of breaking a page.
//
// The order below is the order they appear in the row at the top of /articles.
// It runs inward to outward — the inner life, then relationships, then leading
// other people — rather than by article count.

export type Category = {
  slug: string;
  label: string;
  /** The lede on the category page, and its meta description. */
  description: string;
};

export const CATEGORIES: readonly Category[] = [
  {
    slug: "burnout-rest-and-retreats",
    label: "Burnout, Rest & Retreats",
    description:
      "For the tiredness that sleep does not reach — recognising burnout, and making room to stop.",
  },
  {
    slug: "overthinking-and-worry",
    label: "Overthinking & Worry",
    description:
      "When your mind will not rest: anxiety, rumination, and thinking about faith without spiralling.",
  },
  {
    slug: "prayer-and-hearing-god",
    label: "Prayer & Hearing God",
    description:
      "Prayer, silence, and testing what you think you have heard from God.",
  },
  {
    slug: "dating-and-discernment",
    label: "Dating & Discernment",
    description:
      "Christian dating, red and green flags, and how to decide well before you commit.",
  },
  {
    slug: "marriage-and-premarital",
    label: "Marriage & Premarital",
    description:
      "Preparing for marriage, and the conversations married couples put off having.",
  },
  {
    slug: "church-leadership",
    label: "Church Leadership",
    description:
      "For pastors and new church leaders: training, raising people up, and planning for a group.",
  },
] as const;

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

/** The category for a slug, or null — including for the rows with none set. */
export function getCategory(slug: string | null | undefined): Category | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? null;
}

export function isCategorySlug(slug: string): boolean {
  return BY_SLUG.has(slug);
}

/** Page one is /articles/category/<slug>, not …/page/1. */
export function categoryHref(slug: string, page = 1): string {
  const base = `/articles/category/${slug}`;
  return page <= 1 ? base : `${base}/page/${page}`;
}
