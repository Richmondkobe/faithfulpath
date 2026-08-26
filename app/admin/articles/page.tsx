import Link from "next/link";
import { listArticles } from "@/lib/articles-db";
import { displayDate } from "@/lib/article";

export default async function AdminArticles() {
  const articles = await listArticles();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Articles
        </h1>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-12 leading-relaxed text-[#6B5F53]">
          Nothing here yet. Write the first one.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-[#E5D9C7] border-y border-[#E5D9C7]">
          {articles.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div className="min-w-0">
                <p
                  className="text-lg text-[#2B2118]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {a.title}
                </p>
                <p className="mt-1 text-sm text-[#6B5F53]">
                  /articles/{a.slug}
                  {a.published_at ? ` · ${displayDate(a.published_at)}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <span
                  className={
                    "rounded-sm px-2 py-1 text-[11px] uppercase tracking-[0.18em] " +
                    (a.published
                      ? "bg-[#E5D9C7] text-[#8B5E34]"
                      : "bg-[#F3EADC] text-[#6B5F53]")
                  }
                >
                  {a.published ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
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
