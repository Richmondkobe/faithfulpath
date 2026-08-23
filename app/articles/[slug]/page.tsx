import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, SITE } from "@/lib/site";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#2C5651]">
        {article.date}
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#17222B] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {article.title}
      </h1>

      <div
        className="mt-10 space-y-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        {article.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-16 border-t border-[#D6DBD8] pt-10">
        <p
          className="text-xl leading-snug text-[#17222B]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          If this is where you are right now, we can talk about it properly.
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
