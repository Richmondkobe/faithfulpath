import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Articles | Faithful Path Community",
  description:
    "Writing and teaching on faith, marriage, grief, and staying with God when it is hard.",
};

export default function Articles() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Articles
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Writing on faith, marriage, grief, and staying with God when it gets
        hard.
      </p>

      {ARTICLES.length === 0 ? (
        <p className="mt-14 leading-relaxed text-[#6B5F53]">
          Articles are on their way. In the meantime, if something is weighing
          on you, we can talk about it properly.
        </p>
      ) : (
        <ul className="mt-14 divide-y divide-[#E5D9C7] border-y border-[#E5D9C7]">
          {ARTICLES.map((a) => (
            <li key={a.slug} className="py-8">
              <Link href={"/articles/" + a.slug} className="group block">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                  {a.date}
                </p>
                <h2
                  className="mt-2 text-2xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {a.title}
                </h2>
                <p className="mt-2 leading-relaxed">{a.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <p
          className="text-xl leading-snug text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Reading only takes you so far.
        </p>
        <Link
          href="/talk-to-a-pastor"
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Talk to a pastor — {SITE.price}
        </Link>
      </div>
    </main>
  );
}
