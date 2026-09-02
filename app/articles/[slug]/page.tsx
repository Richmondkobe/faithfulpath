import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import {
  getPublishedArticleBySlug,
  listPublishedArticles,
} from "@/lib/articles-db";
import { displayDate, isoDay } from "@/lib/article";
import { AUTHOR } from "@/lib/types";
import { SITE } from "@/lib/site";

// Saving in the admin calls revalidatePath("/articles/[slug]"); this is the
// backstop for rows edited directly in Supabase.
export const revalidate = 300;

export async function generateStaticParams() {
  const articles = await listPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticleBySlug(slug);
  if (!a) return {};

  const title = a.meta_title ?? a.title;
  const description = a.meta_description ?? undefined;
  const url = `/articles/${slug}`;

  return {
    title,
    description,
    authors: [{ name: AUTHOR.name }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Faithful Path Community",
      authors: [AUTHOR.name],
      images: ["/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getPublishedArticleBySlug(slug);
  if (!a) notFound();

  const date = displayDate(a.published_at);
  const iso = isoDay(a.published_at);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.meta_description,
    datePublished: iso,
    dateModified: iso,
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
        {date}
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

      <ArticleBody source={a.body_md} title={a.title} />

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
