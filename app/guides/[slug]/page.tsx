import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import FinePrint, { FinePrintLink } from "@/components/FinePrint";
import JsonLd from "@/components/JsonLd";
import { TrackedAnchor, TrackedSubmit } from "@/components/analytics/Tracked";
import { abs, breadcrumbs, graph, orgRef, personRef } from "@/lib/schema";
import { bookCategoryHref, getBookCategory } from "@/lib/book-categories";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { getPublishedProductBySlug, listPublishedProducts } from "@/lib/products-db";
import { coverPublicUrl, listSampleSlugs } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/products";
import { SITE } from "@/lib/site";
import { SERIES_LISTED, coursePath, findCourse } from "@/lib/following-jesus";

type Props = { params: Promise<{ slug: string }> };

// Built once and reused, as articles are, rather than rebuilt from the
// database on every visit (it took 1.6 to 2.1 seconds before the first byte).
// Nothing here depends on who is looking. Saving a book in the admin calls
// revalidatePath("/guides/[slug]"); this is the backstop for rows edited
// directly in Supabase.
export const revalidate = 300;

export async function generateStaticParams() {
  const products = await listPublishedProducts();
  return products.map((p) => ({ slug: p.slug }));
}

// Purpose-built 1200x630 social cards, one per guide. A guide without one falls
// back to the site card rather than to its own cover: covers are portrait 2/3
// and a social card crops to roughly 1.91/1, which would slice the title off
// the top. Adding a guide here means adding the file to public/ as well.
const OG_IMAGES: Record<string, string | undefined> = {
  "lead-before-youre-ready": "/og-lead-before-youre-ready.png",
  "talk-before-you-marry": "/og-talk-before-you-marry.png",
  "the-christian-spiritual-reset": "/og-the-christian-spiritual-reset.png",
};

// Hand-picked further reading, keyed by guide slug. Titles are copied from the
// `articles` table so a link reads the same here as it does on the article
// itself. A guide with no entry renders nothing.
const RELATED_ARTICLES: Record<
  string,
  { href: string; title: string }[] | undefined
> = {
  "the-christian-spiritual-reset": [
    {
      href: "/articles/signs-of-spiritual-burnout",
      title: "12 Signs of Spiritual Burnout—and What Actually Helps",
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
    {
      href: "/articles/how-to-start-praying-again",
      title: "How to Start Praying Again After a Long Time Away",
    },
    {
      href: "/articles/is-it-ok-to-be-angry-with-god-lament",
      title: "Is It All Right to Be Angry With God? A Christian Guide to Lament",
    },
  ],
  "talk-before-you-marry": [
    {
      href: "/articles/christian-premarital-counselling-what-to-expect",
      title:
        "Christian Premarital Counselling: What to Expect and How to Prepare",
    },
    {
      href: "/articles/questions-to-ask-before-marriage-christian",
      title:
        "25 Questions to Ask Before Marriage: A Christian Guide for Serious Couples",
    },
    {
      href: "/articles/talking-about-sex-before-marriage-christian-couples",
      title: "The Sex Conversation Before Marriage: A Christian Guide for Engaged Couples",
    },
    {
      href: "/articles/merging-finances-christian-couple-before-marriage",
      title: "Money Before Marriage: A Christian Financial Guide for Engaged Couples",
    },
    {
      href: "/articles/living-together-before-marriage-premarital-counselling",
      title: "Premarital Counselling When You Already Live Together",
    },
    {
      href: "/articles/couples-spiritual-reset-weekend",
      title:
        "How to Take a Christian Couples' Retreat Without Turning It Into Marriage Therapy",
    },
    {
      href: "/articles/christian-dating-advice-wrong-question",
      title: "Christian Dating Advice: You Are Asking the Wrong Question",
    },
    {
      href: "/articles/christian-marriage-help-real-problem",
      title:
        "Christian Marriage Help: The Problem You Name Is Rarely the Real One",
    },
    {
      href: "/articles/money-while-dating",
      title:
        "Christian Dating and Money: Financial Red Flags to Notice Before Engagement.",
    },
    {
      href: "/articles/how-long-to-date-before-engagement",
      title: "How Long Should Christians Date Before Getting Engaged?",
    },
  ],
  "following-jesus-book-1-begin": [
    {
      href: "/articles/what-does-it-mean-to-be-born-again",
      title: "What Does It Mean to Be Born Again? A Simple Guide for New Christians",
    },
    {
      href: "/articles/what-do-christians-believe",
      title: "What Do Christians Believe? The Core Truths of the Faith Explained",
    },
  ],
  "lead-before-youre-ready": [
    {
      href: "/articles/retreat-for-pastors",
      title:
        "A Christian Retreat for Pastors and Ministry Leaders Facing Burnout",
    },
    {
      href: "/articles/church-leadership-training",
      title: "Church Leadership Training: How to Raise Up Leaders Who Last",
    },
    {
      href: "/articles/church-retreat-ideas",
      title: "How to Plan a Christian Group Retreat: Five Formats That Work",
    },
  ],
  "before-you-say-yes": [
    {
      href: "/articles/christian-dating-red-flags",
      title: "Christian Dating Red Flags: 7 Signs Christians Spiritualise",
    },
    {
      href: "/articles/green-flags-christian-relationship",
      title: "10 Green Flags in a Christian Dating Relationship",
    },
    {
      href: "/articles/what-does-equally-yoked-mean",
      title: "What Does \"Equally Yoked\" Mean? A Pastor's Honest Answer",
    },
    {
      href: "/articles/pentecostal-christian-dating",
      title:
        "Can a Pentecostal Date a Baptist? A Christian Guide to Denominational Differences.",
    },
    {
      href: "/articles/christian-dating-boundaries",
      title:
        "Christian Dating Boundaries: Seven Kinds That Matter (Not Just Physical)",
    },
    {
      href: "/articles/god-told-me-to-marry-you",
      title:
        "\"God Told Me to Marry You\": How to Test a Spiritual Claim in Dating",
    },
  ],
  "when-your-mind-wont-rest": [
    {
      href: "/articles/how-to-stop-overthinking-christian",
      title:
        "How to Stop Overthinking as a Christian (Without Being Told to “Just Pray More”)",
    },
    {
      href: "/articles/is-anxiety-a-sin",
      title: "Is Anxiety a Sin? What the Bible Actually Says",
    },
    {
      href: "/articles/how-to-stop-catastrophising-christian",
      title: "Catastrophising: How to Stop Your Mind from Predicting Disaster",
    },
    {
      href: "/articles/how-to-stop-replaying-the-past-christian",
      title: "Why You Keep Replaying the Past—and How to Stop",
    },
    {
      href: "/articles/seeking-gods-will-anxiety-one-more-sign",
      title: "“Just One More Sign”: When Seeking God’s Will Becomes Anxiety",
    },
    {
      href: "/articles/take-every-thought-captive-meaning",
      title: "What “Take Every Thought Captive” Means in Context",
    },
  ],
};

// Books that also exist as a course: the five in the membership, and the four
// Following Jesus books, each its own video course. The note sits under the
// Buy button, where someone is deciding how they want to work through the
// material (website audit V3, N12). The Life Guides booklet has no course.
type CourseEdition = { text: string; href: string };
const MEMBERSHIP_COURSE = "/membership";
const fjCourse = (slug: string): CourseEdition | null => {
  const course = findCourse(slug);
  if (!course || !SERIES_LISTED || !course.launched || !course.listed) return null;
  return {
    text: `This book is also a Following Jesus video course: ${course.seriesLine.charAt(0).toLowerCase()}${course.seriesLine.slice(1, -1)}, each narrated, with a reading plan and a Leader’s Guide.`,
    href: coursePath(course),
  };
};
const COURSE_EDITION: Record<string, CourseEdition | null> = {
  "the-christian-spiritual-reset": {
    text: "This guide is also a guided online course — the same retreat led session by session, with video, guided prayers, timed silences, and printable workbooks.",
    href: MEMBERSHIP_COURSE,
  },
  "when-your-mind-wont-rest": {
    text: "This book is also a guided online course in the membership, taken lesson by lesson at your own pace.",
    href: MEMBERSHIP_COURSE,
  },
  "before-you-say-yes": {
    text: "This book is also a guided online course in the membership: 21 illustrated, narrated lessons, taken at your own pace.",
    href: MEMBERSHIP_COURSE,
  },
  "talk-before-you-marry": {
    text: "This book is also a guided online course for couples in the membership: 15 illustrated, narrated lessons, with conversations to have together.",
    href: MEMBERSHIP_COURSE,
  },
  "lead-before-youre-ready": {
    text: "This book is also a guided online course in the membership, for your first years of leading in a church.",
    href: MEMBERSHIP_COURSE,
  },
  "following-jesus-book-1-begin": fjCourse("begin"),
  "following-jesus-book-2-establish": fjCourse("establish"),
  "following-jesus-book-3-grow": fjCourse("grow"),
  "following-jesus-book-4-multiply": fjCourse("multiply"),
};

// Guides whose Read more list is a selection rather than everything relevant,
// and so ends with a link to the full articles index.
const MORE_ARTICLES: ReadonlySet<string> = new Set([
  "before-you-say-yes",
  "when-your-mind-wont-rest",
]);

/**
 * The description search engines show: the subtitle, then the opening of the
 * book's own description as plain text, cut at a word to about 155 characters.
 * The subtitle alone ("New Life in Christ") said too little about who the book
 * is for (website audit S3).
 */
function searchDescription(subtitle: string | null, markdown: string | null): string | null {
  const plain = (markdown ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sub = subtitle?.trim().replace(/[.:;,]$/, "");
  // Skip the subtitle when the description already opens with the same words.
  const repeats = sub && plain.toLowerCase().startsWith(sub.toLowerCase().split(",")[0]);
  const text = [repeats ? null : sub, plain].filter(Boolean).join(". ");
  if (!text) return null;
  if (text.length <= 155) return text;
  const cut = text.slice(0, 154);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s.,;:—–-]+$/, "")}…`;
}

/**
 * A book description's headings, raised so the shallowest is an h2 under the
 * page's h1 (some were written from ###, which skipped a level for screen
 * readers and search engines; website audit S13). The stored text is unchanged.
 */
function headingsFromTwo(markdown: string): string {
  const levels = [...markdown.matchAll(/^(#{2,6})\s/gm)].map((m) => m[1].length);
  if (levels.length === 0) return markdown;
  const shift = Math.min(...levels) - 2;
  if (shift <= 0) return markdown;
  return markdown.replace(/^(#{2,6})(\s)/gm, (_m, hashes: string, space: string) => `${"#".repeat(hashes.length - shift)}${space}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedProductBySlug(slug);

  if (!guide) return { title: "Book not found" };

  const description =
    searchDescription(guide.subtitle, guide.description) ??
    "A short, practical guide from Faithful Path Community.";

  // Page metadata replaces the root layout's openGraph/twitter objects wholesale
  // rather than merging into them, so siteName and the image have to be repeated
  // here or guide pages would ship without either.
  //
  // A purpose-built 1200x630 card wins where one exists. Only where there is
  // none does the cover stand in: a cover is portrait 2/3 and a social card
  // crops to about 1.91/1, so it arrives with the top and bottom cut off — still
  // better than the generic site card, which says nothing about the book, but
  // worse than a card drawn for the shape.
  const images = [
    OG_IMAGES[slug] ?? coverPublicUrl(guide.cover_path) ?? "/og-default.png",
  ];

  return {
    title: `${guide.title}`,
    description,
    alternates: { canonical: `/guides/${slug}` },
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
  const hasSample = (await listSampleSlugs()).has(slug);
  const related = RELATED_ARTICLES[slug];

  // The price comes from the row, not a constant: structured data that says 29
  // while the button charges something else is worse than none at all.
  // numberOfPages is absent because the products table does not record it.
  const schema = graph(
    {
      "@type": "Book",
      name: guide.title,
      url: abs(`/guides/${slug}`),
      author: personRef,
      publisher: orgRef,
      ...(guide.subtitle || guide.description
        ? { description: guide.subtitle ?? guide.description }
        : {}),
      ...(cover ? { image: cover } : {}),
      bookFormat: "https://schema.org/EBook",
      inLanguage: "en",
      offers: {
        "@type": "Offer",
        price: (guide.price_cents / 100).toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: abs(`/guides/${slug}`),
        seller: orgRef,
      },
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: "Books", path: "/guides" },
      { name: guide.title },
    ])
  );

  const category = getBookCategory(guide.category);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
      <JsonLd data={schema} />

      <Link
        href="/guides"
        className="inline-flex min-h-11 items-center text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium"
      >
        ← All books
      </Link>

      {/* 2fr/3fr is the ~40/60 split. `self-start` keeps the cover column from
          stretching to the row height, which is what lets it stick. */}
      <div className="mt-8 grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-14">
        <div className="self-start md:sticky md:top-10">
          {/* object-contain so the whole cover is visible — a cover whose
              proportions differ from 2/3 letterboxes against the panel colour
              rather than being cropped. */}
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-sand">
            {cover && (
              <Image
                src={cover}
                alt={`Cover of ${guide.title}`}
                fill
                priority
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-contain"
              />
            )}
          </div>
        </div>

        <div>
          {/* Where this book sits in the store, and a way back to the rest of
              its category. A book filed under a slug this code does not know
              shows no label rather than a broken filter. */}
          {category && (
            <Link
              href={bookCategoryHref(category.slug)}
              className="inline-flex min-h-11 items-center text-[11px] uppercase tracking-[0.18em] text-gold-text underline underline-offset-4 transition-colors hover:text-navy font-medium"
            >
              {category.label}
            </Link>
          )}

          <h1
            className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[2.75rem]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {guide.title}
          </h1>

          {guide.subtitle && (
            <div className="mt-4 max-w-xl">
              <Markdown source={guide.subtitle} lede />
            </div>
          )}

          <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
            {formatPrice(guide.price_cents)} · PDF, instant download
          </p>

          <form action="/api/checkout" method="POST" className="mt-6">
            <input type="hidden" name="slug" value={guide.slug} />

            {/* Above the button, not below it: this is the thing the reader is
                agreeing to by pressing it, and Stripe asks them to tick the
                same agreement on the next screen. */}
            <FinePrint className="mb-4 mt-0">
              By buying you agree to immediate download and to our{" "}
              <FinePrintLink href="/terms#books">Terms</FinePrintLink>.
            </FinePrint>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TrackedSubmit
                event="buy_book_click"
                slug={slug}
                className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
              >
                Buy — {formatPrice(guide.price_cents)}
              </TrackedSubmit>

              {/* Secondary by design: the sample is there for the reader who is
                  not ready to decide, and should not compete with Buy. It opens
                  in a new tab so the book's page is still behind it. */}
              {hasSample && (
                <TrackedAnchor
                  event="sample_click"
                  slug={slug}
                  href={`/guides/${slug}/sample`}
                  target="_blank"
                  rel="noopener nofollow"
                  className="inline-flex items-center justify-center rounded-xl border border-navy px-7 py-4 text-[15px] font-medium text-navy transition-colors hover:border-gold-text hover:text-gold-text"
                >
                  Read a free sample
                </TrackedAnchor>
              )}
            </div>

            <FinePrint>
              PDF · instant download · All sales final — read the free sample first ·{" "}
              <FinePrintLink href="/terms#books">Terms</FinePrintLink>
            </FinePrint>
          </form>

          {COURSE_EDITION[slug] && (
            <div className="mt-8 max-w-xl rounded-2xl border border-line bg-paper px-5 py-4">
              <p className="text-sm leading-relaxed text-muted">
                {COURSE_EDITION[slug].text}{" "}
                {/* A plain link: the Following Jesus course pages are whole HTML
                    documents, not React pages, so <Link> pre-loaded them in the
                    background and the request never finished. */}
                <a
                  href={COURSE_EDITION[slug].href}
                  className="font-medium text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
                >
                  See the course
                </a>
                .
              </p>
            </div>
          )}

          {guide.description && (
            <div className="mt-12 max-w-2xl border-t border-line pt-10">
              <Markdown source={headingsFromTwo(guide.description)} />
            </div>
          )}

          {related && (
            <div className="mt-12 max-w-2xl border-t border-line pt-10">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
                Read more
              </h2>
              <ul className="mt-6 space-y-5">
                {related.map((article) => (
                  <li key={article.href}>
                    <Link
                      href={article.href}
                      className="block text-lg leading-snug text-navy transition-colors hover:text-gold-text"
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
              {MORE_ARTICLES.has(slug) && (
                <Link
                  href="/articles"
                  className="mt-6 inline-block text-[15px] font-medium text-gold-text underline-offset-4 hover:underline"
                >
                  More articles →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <p
          className="text-xl leading-snug text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Some things need a conversation, not a book.
        </p>
        <Link
          href="/talk-to-a-pastor"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Talk to a Pastor — {SITE.price}
        </Link>
      </div>
    </main>
  );
}
