import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides | Faithful Path Community",
  description:
    "Short, practical guides on marriage, ministry and faith — written from twenty years of pastoral work.",
};

export default function Guides() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Guides
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Short, practical guides you can read in an evening and use the same
        week. Written from what people actually bring me.
      </p>

      {GUIDES.length === 0 ? (
        <div className="mt-14 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-10">
          <p
            className="text-xl leading-snug text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            The first guide is being written.
          </p>
          <p className="mt-3 max-w-lg leading-relaxed">
            It is coming out of the conversations I am having now, so that it
            answers what people are actually asking rather than what I assume
            they want.
          </p>
        </div>
      ) : (
        <ul className="mt-14 space-y-10">
          {GUIDES.map((g) => (
            <li
              key={g.slug}
              className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-8"
            >
              <h2
                className="text-2xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {g.title}
              </h2>
              <p className="mt-1 text-[#6B5F53]">{g.subtitle}</p>
              <p className="mt-4 max-w-2xl leading-relaxed">{g.description}</p>
              <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {g.pages} · {g.price}
              </p>
              <a
                href={g.checkoutUrl}
                className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
              >
                Buy — {g.price}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <p
          className="text-xl leading-snug text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Some things need a conversation, not a book.
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
