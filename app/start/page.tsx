import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublishedProducts } from "@/lib/products-db";
import { coverPublicUrl, listSampleSlugs } from "@/lib/supabase/admin";
import { formatPrice, type Product } from "@/lib/products";
import { SITE } from "@/lib/site";
import { TrackedLink, TrackedSubmit } from "@/components/analytics/Tracked";
import { COURSE_COUNT_CAP } from "@/lib/membership-courses";

// Saving a book in the admin calls revalidatePath("/start"); this is the
// backstop for rows edited directly in Supabase.
export const revalidate = 300;

/**
 * /start — the link in the Instagram bio. Built for a phone first: the two
 * "Start here" books side by side (both covers on the first screen), the free
 * community, the other books, then the membership and Talk to a Pastor.
 *
 * The pair: if exactly two books are ticked "Featured on /start" in the admin,
 * those two; otherwise Before You Say Yes and Talk Before You Marry
 * (Richmond, 12 November 2026).
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

/** The default "Start here" pair, in the order shown. */
const START_PAIR = ["before-you-say-yes", "talk-before-you-marry"];

/** One click event per book, e.g. start_buy_before_you_say_yes. */
const buyEvent = (slug: string) => `start_buy_${slug.replace(/-/g, "_")}`;

/**
 * One book of the pair. Buy posts to /api/checkout exactly as the book's own
 * page does, so it starts the same Stripe checkout at the price in the
 * database. The sample opens in a new tab, as on the book page.
 */
function PairBook({ book, hasSample }: { book: Product; hasSample: boolean }) {
  const cover = coverPublicUrl(book.cover_path);
  return (
    <li className="flex flex-col items-center text-center">
      <Link href={`/guides/${book.slug}`} className="group flex w-full flex-col items-center">
        <div className="relative aspect-[2/3] w-full max-w-[8.5rem] overflow-hidden rounded-md bg-night/40">
          {cover && (
            <Image
              src={cover}
              alt={`Cover of ${book.title}`}
              fill
              sizes="8.5rem"
              loading="eager"
              fetchPriority="high"
              className="object-contain"
            />
          )}
        </div>
        <h3 className="mt-3 text-[17px] leading-snug text-sun group-hover:underline" style={DISPLAY}>
          {book.title}
        </h3>
      </Link>
      <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-gold-soft">{formatPrice(book.price_cents)}</p>
      <form action="/api/checkout" method="POST" className="mt-auto w-full pt-3">
        <input type="hidden" name="slug" value={book.slug} />
        <TrackedSubmit
          event={buyEvent(book.slug)}
          slug={book.slug}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gold px-3 text-[16px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Buy
        </TrackedSubmit>
      </form>
      {hasSample && (
        <a
          href={`/guides/${book.slug}/sample`}
          target="_blank"
          rel="noopener nofollow"
          className="mt-2 inline-flex min-h-[44px] items-center text-[14px] text-sand underline underline-offset-4 transition-colors hover:text-gold-soft"
        >
          Read a free sample
        </a>
      )}
    </li>
  );
}

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
  const [books, samples] = await Promise.all([listPublishedProducts(), listSampleSlugs()]);
  const toggled = books.filter((b) => b.featured_on_start);
  const pair =
    toggled.length === 2
      ? toggled
      : START_PAIR.map((slug) => books.find((b) => b.slug === slug)).filter((b): b is Product => Boolean(b));
  const others = books.filter((b) => !pair.includes(b));

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-16 sm:pt-12">
      <header className="text-center">
        <h1 className="text-[1.75rem] leading-tight text-navy" style={DISPLAY}>
          Pastor Richmond Kobe
        </h1>
        <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-gold-text">{SITE.name}</p>
      </header>

      {/* The two books first, then the community (Richmond, 12 November 2026). */}
      {pair.length > 0 && (
        <section aria-labelledby="start-here-title" className="mt-6 rounded-2xl bg-navy px-4 pt-5 pb-4 shadow-sm">
          <h2
            id="start-here-title"
            className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft"
          >
            Start here
          </h2>
          <p className="mt-2 text-center leading-relaxed text-sand">
            Choosing wisely, then preparing well. Two guides that belong together.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-4">
            {pair.map((b) => (
              <PairBook key={b.id} book={b} hasSample={samples.has(b.slug)} />
            ))}
          </ul>
          {/* The book page's agreement line, shown before either Buy is pressed. */}
          <p className="mt-3 text-center text-[13px] leading-relaxed text-sand/80">
            PDF, instant download. By buying you agree to immediate download and to our{" "}
            <Link href="/terms#books" className="underline underline-offset-4 hover:text-gold-soft">
              Terms
            </Link>
            .
          </p>
        </section>
      )}

      <div className="mt-8">
        <TrackedLink
          href="/community"
          event="start_community"
          className="block rounded-2xl bg-navy p-5 transition-colors hover:bg-night"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Free</p>
          <p className="mt-2 text-xl text-sun" style={DISPLAY}>
            Join the community
          </p>
          <p className="mt-2 leading-relaxed text-sand">
            A place to grow, pray and walk with others: a Prayer Wall and a place to ask your questions.
          </p>
          <span className="mt-4 inline-block font-semibold text-gold-soft">Join free ›</span>
        </TrackedLink>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="books-title" className="mt-10">
          <h2 id="books-title" className="text-xl text-navy" style={DISPLAY}>
            {pair.length > 0 ? "More books" : "Books"}
          </h2>
          <ul className="mt-4 space-y-3">
            {others.map((b) => (
              <BookRow key={b.id} book={b} />
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Membership, pastoral conversations and giving" className="mt-10 space-y-4">
        <TrackedLink
          href="/membership"
          event="start_membership"
          className="block rounded-2xl border border-gold-line/60 bg-paper p-5 transition-colors hover:border-gold-line active:bg-cream"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Membership · US$19 a month</p>
          <p className="mt-2 text-xl text-navy" style={DISPLAY}>
            {COURSE_COUNT_CAP} Christian courses, one membership
          </p>
          <p className="mt-2 leading-relaxed text-ink">
            Burnout, worry, dating, marriage, church leadership and spiritual warfare. Learn at home, at your own pace. Cancel any time.
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

        <TrackedLink
          href="/give"
          event="start_give"
          className="flex items-center justify-between gap-4 rounded-2xl border border-gold-line/60 bg-paper px-5 py-4 transition-colors hover:border-gold-line active:bg-cream"
        >
          <span>
            <span className="block text-lg text-navy" style={DISPLAY}>
              Support the ministry
            </span>
            <span className="mt-0.5 block text-[15px] text-muted">Give monthly or once.</span>
          </span>
          <span aria-hidden="true" className="text-xl text-gold-text">›</span>
        </TrackedLink>
      </section>
    </main>
  );
}
