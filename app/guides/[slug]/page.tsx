import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { getPublishedProductBySlug } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/products";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

// Purpose-built 1200x630 social cards, one per guide. A guide without one falls
// back to the site card rather than to its own cover: covers are portrait 2/3
// and a social card crops to roughly 1.91/1, which would slice the title off
// the top. Adding a guide here means adding the file to public/ as well.
const OG_IMAGES: Record<string, string | undefined> = {
  "lead-before-youre-ready": "/og-lead-before-youre-ready.png",
  "talk-before-you-marry": "/og-talk-before-you-marry.png",
};

// Hand-picked further reading, keyed by guide slug. Only the Spiritual Reset
// guide has articles close enough to its subject to be worth pointing at, so
// every other guide renders nothing here.
const RELATED_ARTICLES: Record<
  string,
  { href: string; title: string }[] | undefined
> = {
  "the-christian-spiritual-reset": [
    {
      href: "/articles/signs-of-spiritual-burnout",
      title: "12 Signs of Spiritual Burnout — and What Actually Helps",
    },
    {
      href: "/articles/three-day-christian-retreat-schedule",
      title:
        "A Three-Day Christian Retreat Schedule: Seven Guided Sessions for Rest and Renewal",
    },
    {
      href: "/articles/retreat-for-pastors",
      title: "A Christian Retreat for Pastors and Ministry Leaders Facing Burnout",
    },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedProductBySlug(slug);

  if (!guide) return { title: "Guide not found | Faithful Path Community" };

  const description =
    guide.subtitle ??
    guide.description?.slice(0, 155) ??
    "A short, practical guide from Faithful Path Community.";

  // Page metadata replaces the root layout's openGraph/twitter objects wholesale
  // rather than merging into them, so siteName and the image have to be repeated
  // here or guide pages would ship without either.
  const images = [OG_IMAGES[slug] ?? "/og-default.png"];

  return {
    title: `${guide.title} | Faithful Path Community`,
    description,
    openGraph: {
      type: "website",
      url: `/guides/${slug}`,
      title: guide.title,
      description,
      siteName: "Faithful Path Community",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description,
      images,
    },
  };
}

export default async function Guide({ params }: Props) {
  const { slug } = await params;
  const guide = await getPublishedProductBySlug(slug);

  if (!guide) notFound();

  const cover = coverPublicUrl(guide.cover_path);
  const related = RELATED_ARTICLES[slug];

  return (
    <main className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href="/guides"
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← All guides
      </Link>

      {/* 2fr/3fr is the ~40/60 split. `self-start` keeps the cover column from
          stretching to the row height, which is what lets it stick. */}
      <div className="mt-8 grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-14">
        <div className="self-start md:sticky md:top-10">
          {/* object-contain so the whole cover is visible — a cover whose
              proportions differ from 2/3 letterboxes against the panel colour
              rather than being cropped. */}
          <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
            {cover && (
              <Image
                src={cover}
                alt={guide.title}
                fill
                priority
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-contain"
              />
            )}
          </div>
        </div>

        <div>
          <h1
            className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[2.75rem]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {guide.title}
          </h1>

          {guide.subtitle && (
            <p
              className="mt-4 max-w-xl text-lg leading-relaxed"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {guide.subtitle}
            </p>
          )}

          <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            {formatPrice(guide.price_cents)} · PDF, instant download
          </p>

          <form action="/api/checkout" method="POST" className="mt-6">
            <input type="hidden" name="slug" value={guide.slug} />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
            >
              Buy — {formatPrice(guide.price_cents)}
            </button>
          </form>

          {guide.description && (
            <div className="mt-12 max-w-2xl border-t border-[#E5D9C7] pt-10">
              <Markdown source={guide.description} />
            </div>
          )}

          {related && (
            <div className="mt-12 max-w-2xl border-t border-[#E5D9C7] pt-10">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                Read more
              </h2>
              <ul className="mt-6 space-y-5">
                {related.map((article) => (
                  <li key={article.href}>
                    <Link
                      href={article.href}
                      className="block text-lg leading-snug text-[#2B2118] transition-colors hover:text-[#8B5E34]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 400,
                      }}
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

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
