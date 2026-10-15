import Link from "next/link";
import { listArticles } from "@/lib/articles-db";
import { displayDate } from "@/lib/article";
import { requireAdmin } from "@/lib/auth";

export default async function AdminArticles() {
  // Checked here as well as in the layout: a layout does not stop its pages
  // rendering on their own, and these read with the service-role key.
  await requireAdmin();
  const articles = await listArticles();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Articles
        </h1>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-12 leading-relaxed text-muted">
          Nothing here yet. Write the first one.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {articles.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div className="min-w-0">
                <p
                  className="text-lg text-navy"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {a.title}
                </p>
                <p className="mt-1 text-sm text-muted">
                  /articles/{a.slug}
                  {a.published_at ? ` · ${displayDate(a.published_at)}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <span
                  className={
                    "rounded-xl px-2 py-1 text-[11px] uppercase tracking-[0.18em] font-medium " +
                    (a.published
                      ? "bg-line text-gold-text"
                      : "bg-sand text-muted")
                  }
                >
                  {a.published ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-gold-text"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
