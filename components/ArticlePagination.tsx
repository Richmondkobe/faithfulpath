import Link from "next/link";
import { articlesPageHref } from "@/lib/articles-db";

/**
 * Newer / Older either side of the page numbers.
 *
 * "Newer" and "Older" rather than "Previous" and "Next": the index runs newest
 * first, and on a list of writing those words say which direction you are
 * actually travelling.
 */
export default function ArticlePagination({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const link =
    "text-sm text-[#2C5651] underline underline-offset-4 transition-colors hover:text-[#17222B]";
  const disabled = "text-sm text-[#9AA8A3]";

  return (
    <nav
      aria-label="Article pages"
      className="mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-[#D6DBD8] pt-8"
    >
      {page > 1 ? (
        <Link href={articlesPageHref(page - 1)} className={link}>
          ← Newer
        </Link>
      ) : (
        <span className={disabled}>← Newer</span>
      )}

      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === page ? (
              <span
                aria-current="page"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-[#2C5651] px-3 text-[#17222B]"
              >
                {n}
              </span>
            ) : (
              <Link
                href={articlesPageHref(n)}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-[#D6DBD8] px-3 text-[#5A6A73] transition-colors hover:border-[#2C5651] hover:text-[#17222B]"
              >
                <span className="sr-only">Page </span>
                {n}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {page < pageCount ? (
        <Link href={articlesPageHref(page + 1)} className={link}>
          Older →
        </Link>
      ) : (
        <span className={disabled}>Older →</span>
      )}
    </nav>
  );
}
