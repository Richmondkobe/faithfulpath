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
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#17222B] sm:text-[3.25rem]"
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
        <p className="mt-14 leading-relaxed text-[#5A6A73]">
          Articles are on their way. Iimport Link from "next/link";
importhing
          on you, we can talk about it properly.
        </p>
      ) : (
        <ul className="mt-14 divide-y divide-[#D6DBD8] border-y border-[#D6DBD8]">
          {ARTICLES.map((a) => (
            <li key={a.slug} className="py-8">
              <Link href={"/articles/" + a.slug} className="group block">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#2C5651]">
                  {a.date}
                </p>
                <h2
                  className="mt-2 text-2xl text-[#17222B] transition-colors group-hover:text-[#2C5651]"
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

      <div className="mt-16 border-t border-[#D6DBD8] pt-10">
        <p
          className="text-xl leading-snug text-[#17222B]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Reading only takes you so far.
        </p>
        <Link
          href="/talk-to-a-pastor"
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-[#17222B] px-7 py-4 text-[15px] font-medium text-[#FCFCFB] transition-colors hover:bg-[#2C5651]"
        >
          Talk to a pastor — {SITE.price}
        </Link>
      </div>
    </main>
  );
}
