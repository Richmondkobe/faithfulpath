import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_ARTICLES } from "@/lib/articles";
import { AUTHOR } from "@/lib/types";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = ALL_ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    authors: [{ name: AUTHOR.name }],
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = ALL_ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.metaDescription,
    datePublished: a.isoDate,
    dateModified: a.isoDate,
    author: {
      "@type": "Person",
      name: AUTHOR.name,
      description: AUTHOR.credential,
    },
    publisher: {
      "@type": "Organization",
      name: "Faithful Path Community",
    },
  };

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {a.date}
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {a.title}
      </h1>

      <div className="mt-8 flex items-center gap-4 border-y border-[#E5D9C7] py-5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
          <Image src={AUTHOR.image} alt={AUTHOR.name} fill sizes="3rem" className="object-cover" />
        </div>
        <div>
          <p className="font-medium text-[#2B2118]">{AUTHOR.name}</p>
          <p className="text-sm text-[#6B5F53]">{AUTHOR.credential}</p>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {a.body.map((block, i) => {
          if ("h2" in block)
            return (
              <h2
                key={i}
                className="pt-6 text-2xl leading-snug text-[#2B2118] sm:text-3xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                {block.h2}
              </h2>
            );
          if ("h3" in block)
            return (
              <h3
                key={i}
                className="pt-4 text-xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {block.h3}
              </h3>
            );
          if ("list" in block)
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 text-lg leading-relaxed">
                {block.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          return (
            <p
              key={i}
              className="text-lg leading-relaxed"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {block.p}
            </p>
          );
        })}
      </div>

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <p
          className="text-xl leading-snug text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          If this is where you are right now, we can talk about it properly.
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
