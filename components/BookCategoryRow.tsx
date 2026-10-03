import Link from "next/link";

import { BOOK_CATEGORIES, bookCategoryHref } from "@/lib/book-categories";

/**
 * The row of categories above the book list.
 *
 * Styled to match CategoryRow on /articles, so the two shop-and-read surfaces
 * filter the same way. A category with nothing published in it is left out
 * rather than shown as a dead end — `counts` is worked out by the caller,
 * which already has every published book in hand.
 *
 * Plain links, not buttons with JavaScript: the filter is a query string the
 * server reads, so it works with scripting off, survives a reload, and can be
 * shared or bookmarked.
 */
export default function BookCategoryRow({
  counts,
  active,
}: {
  counts: Map<string, number>;
  /** The category being viewed, marked rather than linked. */
  active?: string;
}) {
  const shown = BOOK_CATEGORIES.filter((c) => (counts.get(c.slug) ?? 0) > 0);
  if (shown.length === 0) return null;

  const selected =
    "inline-flex items-center rounded-sm border border-[#2C5651] bg-[#2C5651] px-3 py-1.5 text-sm text-[#FCFCFB]";
  const link =
    "inline-flex items-center rounded-sm border border-[#D6DBD8] px-3 py-1.5 text-sm text-[#5A6A73] transition-colors hover:border-[#2C5651] hover:text-[#17222B]";

  return (
    <nav aria-label="Book categories" className="mt-10">
      <ul className="flex flex-wrap gap-2">
        <li>
          {active ? (
            <Link href="/guides" className={link}>
              All
            </Link>
          ) : (
            <span aria-current="page" className={selected}>
              All
            </span>
          )}
        </li>

        {shown.map((c) => (
          <li key={c.slug}>
            {c.slug === active ? (
              <span aria-current="page" className={selected}>
                {c.label}
              </span>
            ) : (
              <Link href={bookCategoryHref(c.slug)} className={link}>
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
