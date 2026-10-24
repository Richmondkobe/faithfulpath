import type { Metadata } from "next";
import Image from "next/image";
import { listPublishedProducts } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { formatPrice, type Product } from "@/lib/products";
import { SITE } from "@/lib/site";
import { TrackedLink } from "@/components/analytics/Tracked";

// Saving a book in the admin calls revalidatePath("/start"); this is the
// backstop for rows edited directly in Supabase.
export const revalidate = 300;

/**
 * /start — the link in the Instagram bio. Built for a phone first: the
 * featured book (Richmond's choice, "Featured on /start" in the admin), the
 * other books, then the membership and Talk to a Pastor.
 *
 * Kept out of search results and the sitemap: it repeats what /guides and the
 * home page already say, and exists for people arriving from Instagram.
 */
export const metadata: Metadata = {
  title: "Start here",
  description: "Books, courses and pastoral conversations with Pastor Richmond Kobe.",
  alternates: { canonical: "/start" },
  robots: { index: false, follow: true },
};

const DISPLAY = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

function BookRow({ book }: { book: Product }) {
  const cover = coverPublicUrl(book.cover_path);
  return (
    <li>
      <TrackedLink
        href={`/guides/${book.slug}`}
        event="start_book"
        slug={book.slug}
        className="flex min-h-[5.5rem] items-center gap-4 rounded-xl border border-line bg-paper p-3 transition-colors hover:border-gold-line active:bg-cream"
      >
        <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
          {cover && <Image src={cover} alt="" fill sizes="48px" className="object-contain" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="leading-snug text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
            {book.title}
          </p>
          <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-gold-text">{formatPrice(book.price_cents)}</p>
        </div>
        <span aria-hidden="true" className="pr-1 text-xl text-gold-text">›</span>
      </TrackedLink>
    </li>
  );
}

export default async function Start() {
  const books = await listPublishedProducts();
  const featured = books.find((b) => b.featured_on_start) ?? null;
  const others = books.filter((b) => b !== featured);
  const featuredCover = featured ? coverPublicUrl(featured.cover_path) : null;

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-16 sm:pt-12">
      <header className="text-center">
        <h1 className="text-[1.75rem] leading-tight text-navy" style={DISPLAY}>
          Pastor Richmond Kobe
        </h1>
        <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-gold-text">{SITE.name}</p>
      </header>

      {featured && (
        <section aria-labelledby="featured-title" className="mt-8 rounded-2xl bg-navy px-5 pt-6 pb-6 text-center shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Featured</p>
          {featuredCover && (
            <div className="relative mx-auto mt-4 aspect-[2/3] w-48 overflow-hidden rounded-lg">
              <Image
                src={featuredCover}
                alt={`Cover of ${featured.title}`}
                fill
                sizes="12rem"
                loading="eager"
                fetchPriority="high"
                className="object-contain"
              />
            </div>
          )}
          <h2 id="featured-title" className="mt-5 text-2xl leading-snug text-sun" style={DISPLAY}>
            {featured.title}
          </h2>
          {featured.subtitle && <p className="mt-2 leading-relaxed text-sand">{featured.subtitle}</p>}
          <TrackedLink
            href={`/guides/${featured.slug}`}
            event="start_featured_book"
            slug={featured.slug}
            className="mt-6 flex min-h-14 w-full items-center justify-center rounded-xl bg-gold px-6 text-[17px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            Get the book · {formatPrice(featured.price_cents)}
          </TrackedLink>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="books-title" className="mt-10">
          <h2 id="books-title" className="text-xl text-navy" style={DISPLAY}>
            {featured ? "More books" : "Books"}
          </h2>
          <ul className="mt-4 space-y-3">
            {others.map((b) => (
              <BookRow key={b.id} book={b} />
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Membership and pastoral conversations" className="mt-10 space-y-4">
        <TrackedLink
          href="/membership"
          event="start_membership"
          className="block rounded-2xl border border-gold-line/60 bg-paper p-5 transition-colors hover:border-gold-line active:bg-cream"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Membership · US$19 a month</p>
          <p className="mt-2 text-xl text-navy" style={DISPLAY}>
            Five Christian courses, one membership
          </p>
          <p className="mt-2 leading-relaxed text-ink">
            Burnout, worry, dating, marriage and church leadership. Learn at home, at your own pace. Cancel any time.
          </p>
          <span className="mt-4 inline-block font-semibold text-gold-text">See the membership ›</span>
        </TrackedLink>

        <TrackedLink
          href="/talk-to-a-pastor"
          event="start_talk_to_a_pastor"
          className="block rounded-2xl border border-gold-line/60 bg-paper p-5 transition-colors hover:border-gold-line active:bg-cream"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Talk to a Pastor · {SITE.price}</p>
          <p className="mt-2 text-xl text-navy" style={DISPLAY}>
            Talk to a Pastor
          </p>
          {/* The Talk to a Pastor page's own description, word for word. */}
          <p className="mt-2 leading-relaxed text-ink">
            One hour online with a pastor of twenty years. Written intake, a live conversation, and a written follow-up
            within 24 hours.
          </p>
          <span className="mt-4 inline-block font-semibold text-gold-text">Book a conversation ›</span>
        </TrackedLink>
      </section>
    </main>
  );
}
