import Link from "next/link";
import { displayDate } from "@/lib/article";
import type { Article } from "@/lib/article";
import { getCategory } from "@/lib/categories";

/** The articles as cards: three to a row on a computer, two on a tablet, one on a phone. */
export default function ArticleCards({
  articles,
}: {
  articles: Pick<Article, "slug" | "title" | "excerpt" | "published_at" | "category">[];
}) {
  return (
    <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => {
        const cat = getCategory(a.category);
        const date = displayDate(a.published_at);
        return (
          <li key={a.slug} className="flex">
            <Link
              href={"/articles/" + a.slug}
              className="group flex w-full flex-col rounded-2xl border border-gold-line/50 bg-paper p-6 shadow-sm transition-[border-color,box-shadow] hover:border-gold-line hover:shadow-md"
            >
              <h2
                className="text-[1.375rem] leading-snug text-navy"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {a.title}
              </h2>
              {a.excerpt && <p className="mt-3 line-clamp-4 leading-relaxed">{a.excerpt}</p>}
              {/* Gold for text is gold-text: bright gold is for accents only
                  (app/globals.css). */}
              <span className="mb-5 mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-text group-hover:underline">
                Read more <span aria-hidden="true">»</span>
              </span>
              {/* Plain text inside the card: a link within a link is not
                  valid markup, so the label routes to the category only from
                  the article page itself. */}
              <p className="mt-auto border-t border-line pt-4 text-[13px] font-medium text-muted">
                Richmond Kobe
                {date && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {date}
                  </>
                )}
                {cat && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {cat.label}
                  </>
                )}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
