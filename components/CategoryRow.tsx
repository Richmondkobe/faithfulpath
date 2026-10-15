import Link from "next/link";
import { CATEGORIES, categoryHref } from "@/lib/categories";

/**
 * The row of topics above the article list.
 *
 * A category with nothing published in it is left out rather than shown as a
 * dead end — `counts` comes from countPublishedByCategory().
 */
export default function CategoryRow({
  counts,
  active,
}: {
  counts: Map<string, number>;
  /** The category being viewed, marked rather than linked. */
  active?: string;
}) {
  const shown = CATEGORIES.filter((c) => (counts.get(c.slug) ?? 0) > 0);
  if (shown.length === 0) return null;

  return (
    <nav aria-label="Article topics" className="mt-10">
      <ul className="flex flex-wrap gap-2">
        <li>
          {active ? (
            <Link
              href="/articles"
              className="inline-flex items-center rounded-xl border border-gold-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-navy hover:bg-paper"
            >
              All
            </Link>
          ) : (
            <span
              aria-current="page"
              className="inline-flex items-center rounded-xl border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-paper"
            >
              All
            </span>
          )}
        </li>

        {shown.map((c) =>
          c.slug === active ? (
            <li key={c.slug}>
              <span
                aria-current="page"
                className="inline-flex items-center rounded-xl border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-paper"
              >
                {c.label}
              </span>
            </li>
          ) : (
            <li key={c.slug}>
              <Link
                href={categoryHref(c.slug)}
                className="inline-flex items-center rounded-xl border border-gold-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-navy hover:bg-paper"
              >
                {c.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}
