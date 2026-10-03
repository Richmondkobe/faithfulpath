import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import BookCategoryRow from "@/components/BookCategoryRow";
import FinePrint, { FinePrintLink } from "@/components/FinePrint";
import WhichIsRight from "@/components/WhichIsRight";
import { listPublishedProducts } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { formatPrice, type Product } from "@/lib/products";
import { BOOK_CATEGORIES, getBookCategory, isBookCategorySlug } from "@/lib/book-categories";
import { SITE } from "@/lib/site";

// No revalidate: reading ?category= makes this page dynamic, so an ISR window
// would be meaningless. The query is ten rows, and the side-effect is that a
// book published in the admin shows here at once rather than within a minute.

// The URL stays /guides. What these are called changed; where they live did
// not, so every link already shared still lands. Filtering is a query string
// for the same reason — one canonical URL for the store.
const TITLE = "Books | Faithful Path Community";

// No count in the description. The previous one opened "Five practical
// Christian books" and was still saying so at ten, which is how a number in
// metadata goes: nobody revisits it when a book is published. The four
// category names carry the same information and do not expire.
const DESCRIPTION =
  "Short, practical Christian books as instant PDF downloads: following Jesus " +
  "from the beginning, dating and marriage, rest and worry, and church leadership.";

// The shared card. Every book has its own 1200x630 image, but the store is not
// any one of them, and a portrait cover would crop to a band in a social card —
// see the note above OG_IMAGES in app/guides/[slug]/page.tsx.
const OG_IMAGE = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: "Faithful Path Community",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  // Page metadata replaces the root layout's openGraph/twitter objects
  // wholesale rather than merging into them, so siteName and the url have to be
  // repeated. Without this block the store shared a link showing the site-wide
  // blurb about pastoral counselling, which says nothing about books.
  openGraph: {
    type: "website",
    url: "/guides",
    siteName: "Faithful Path Community",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

/** One book in the grid. Its title is an h3, under the category's h2. */
function BookCard({ book }: { book: Product }) {
  const cover = coverPublicUrl(book.cover_path);
  return (
    <li>
      <Link href={`/guides/${book.slug}`} className="group block">
        {/* Matches the detail page: object-contain so the whole cover shows
            rather than being cropped. */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
          {cover && (
            <Image
              src={cover}
              alt={`Cover of ${book.title}`}
              fill
              sizes="(min-width: 1024px) 20rem, (min-width: 640px) 40vw, 90vw"
              className="object-contain transition-opacity group-hover:opacity-90"
            />
          )}
        </div>
        <h3
          className="mt-4 text-xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="mt-1 leading-relaxed text-[#6B5F53]">{book.subtitle}</p>
        )}
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          {formatPrice(book.price_cents)}
        </p>
      </Link>

      {/* Outside the card's own link, not inside it: the Terms link is an
          anchor, and an anchor inside an anchor is invalid and swallows the
          click. */}
      {/* The products table records no page count — only a pdf_path — so this
          is the short form. Add a column and the "N pages" belongs between the
          two. */}
      <FinePrint>
        PDF · instant download · All sales final — read the free sample first ·{" "}
        <FinePrintLink href="/terms#books">Terms</FinePrintLink>
      </FinePrint>
    </li>
  );
}

export default async function Guides({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const guides = await listPublishedProducts();

  const { category } = await searchParams;
  const asked = Array.isArray(category) ? category[0] : category;
  // An unknown slug shows the whole store rather than an error or an empty
  // shelf: a mistyped or stale link should still sell books.
  const active = asked && isBookCategorySlug(asked) ? asked : undefined;

  const counts = new Map<string, number>();
  for (const g of guides) {
    if (g.category) counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
  }

  const groups = BOOK_CATEGORIES.filter((c) => !active || c.slug === active)
    .map((c) => ({
      heading: c.label,
      books: guides.filter((g) => g.category === c.slug),
    }))
    .filter((g) => g.books.length > 0);

  // A published book whose category is unset, or set to a slug this code does
  // not know, still has to appear in the store — it is a book on sale. It gets
  // a heading of its own rather than none, so the h1/h2/h3 order stays valid.
  const unfiled = active ? [] : guides.filter((g) => !getBookCategory(g.category));
  if (unfiled.length > 0) groups.push({ heading: "Other books", books: unfiled });

  return (
    <main className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Books
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Short, practical books you can read in an evening and use the same
        week. Written from what people actually bring me.
      </p>

      <WhichIsRight here="/guides" />

      {guides.length === 0 ? (
        <div className="mt-14 max-w-2xl rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-10">
          <p
            className="text-xl leading-snug text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            The first book is being written.
          </p>
          <p className="mt-3 max-w-lg leading-relaxed">
            It is coming out of the conversations I am having now, so that it
            answers what people are actually asking rather than what I assume
            they want.
          </p>
        </div>
      ) : (
        <>
          <BookCategoryRow counts={counts} active={active} />

          {groups.map((group) => (
            <section key={group.heading} className="mt-14">
              <h2
                className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
                style={{ fontWeight: 500 }}
              >
                {group.heading}
              </h2>
              <ul className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {group.books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </ul>
            </section>
          ))}
        </>
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
