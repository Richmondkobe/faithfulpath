import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HELP_PATH } from "@/lib/site";

import FinePrint, { FinePrintLink } from "@/components/FinePrint";
import JsonLd from "@/components/JsonLd";
import { TrackedSubmit } from "@/components/analytics/Tracked";
import { abs, breadcrumbs, graph, orgRef } from "@/lib/schema";
import { listPublishedProducts } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";

// From the approved page's own heading and opening line.
const TITLE = "Five Christian courses, one membership";
// Under 160 characters, with the price early, so a search result shows it
// whole (website audit S5).
const DESCRIPTION =
  "Five Christian courses with Pastor Richmond Kobe for US$19 a month: burnout, worry, dating, marriage and church leadership. Learn at home; cancel any time.";

// A purpose-built 1200x630 card, like the ones the guides use. The course cover
// itself is portrait 2/3, which a social card would crop to a band and cut the
// title off — see the note above OG_IMAGES in app/guides/[slug]/page.tsx.
const OG_IMAGE = {
  url: "/og-membership.png",
  width: 1200,
  height: 630,
  alt: "The Christian Spiritual Reset — a guided online retreat with Pastor Richmond Kobe",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/membership" },
  // Page metadata replaces the root layout's openGraph/twitter objects wholesale
  // rather than merging into them, so siteName and the url have to be repeated.
  openGraph: {
    type: "website",
    url: "/membership",
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

const heading = { fontFamily: "var(--font-display)", fontWeight: 500 } as const;
const lede = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 text-2xl text-navy" style={heading}>
      {children}
    </h2>
  );
}

// The five courses, each with the book it is built on. Titles and lines are
// the approved wording.
const COURSES: { title: string; line: string; book: string }[] = [
  {
    title: "The Christian Spiritual Reset",
    line: "a guided retreat at home for burnout and spiritual dryness.",
    book: "the-christian-spiritual-reset",
  },
  { title: "When Your Mind Won’t Rest", line: "overthinking, worry and fear.", book: "when-your-mind-wont-rest" },
  {
    title: "Before You Say Yes",
    line: "discernment in dating and the decision to marry.",
    book: "before-you-say-yes",
  },
  { title: "Talk Before You Marry", line: "fifteen lessons for couples before marriage.", book: "talk-before-you-marry" },
  {
    title: "Lead Before You’re Ready",
    line: "for your first years of leading in a church.",
    book: "lead-before-youre-ready",
  },
];

/** Each course's book cover, from the published books. Read only; a missing one shows a plain tile. */
async function courseCovers(): Promise<Map<string, string>> {
  const books = await listPublishedProducts();
  const covers = new Map<string, string>();
  for (const b of books) {
    const url = coverPublicUrl(b.cover_path);
    if (url) covers.set(b.slug, url);
  }
  return covers;
}

function Bold({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-navy">{children}</strong>;
}

/**
 * Both Join buttons post to the same existing Stripe checkout route.
 *
 * `id` is set on the first one only, so /membership#join lands on it. The home
 * page's course block links there rather than to the top of this page, where a
 * reader who has already decided would have to find the button themselves.
 */
function JoinButton({ label, id }: { label: string; id?: string }) {
  return (
    <form
      action="/api/membership/checkout"
      method="POST"
      className="mt-8"
      id={id}
    >
      {/* Both Join buttons render through here, so both report the click. */}
      <TrackedSubmit
        event="join_click"
        className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
      >
        {label}
      </TrackedSubmit>

      {/* Both Join buttons render through here, so both carry it. */}
      <FinePrint>
        Cancel any time · Full refund within 7 days of your first payment ·{" "}
        <FinePrintLink href="/terms">Terms</FinePrintLink>
      </FinePrint>

      {/* A way in for someone who already pays (Richmond, 8 October 2026). */}
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Already a member?{" "}
        <Link
          href="/members/login"
          className="font-medium text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Faq({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="leading-relaxed">
        <Bold>{question}</Bold>
      </p>
      <p className="mt-2 leading-relaxed">{children}</p>
    </div>
  );
}

// The membership, and the five courses it opens, as the page shows them
// (website audit S4: this used to describe the Spiritual Reset alone). Course,
// not an accredited programme: there is deliberately no
// educationalCredentialAwarded, since a certificate of completion is not a
// qualification and structured data should not claim it is.
const MONTHLY = {
  "@type": "Offer",
  price: "19.00",
  priceCurrency: "USD",
  availability: "https://schema.org/InStock",
  url: abs("/membership"),
  seller: orgRef,
  priceSpecification: {
    "@type": "UnitPriceSpecification",
    price: "19.00",
    priceCurrency: "USD",
    billingDuration: 1,
    billingIncrement: 1,
    unitCode: "MON",
  },
};
const COURSE_SCHEMA = graph(
  breadcrumbs([{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }, { name: "Membership" }]),
  {
    "@type": "Product",
    name: "Faithful Path Membership",
    description: DESCRIPTION,
    url: abs("/membership"),
    brand: orgRef,
    offers: MONTHLY,
  },
  {
    "@type": "ItemList",
    name: "Courses in the Faithful Path Membership",
    itemListElement: COURSES.map((course, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: course.title,
        description: `${course.title}: ${course.line}`,
        provider: orgRef,
        inLanguage: "en",
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
        offers: { ...MONTHLY, category: "Subscription" },
      },
    })),
  }
);

// Refreshed like the book pages, so a new cover shows without a deploy.
export const revalidate = 300;

export default async function Membership() {
  const covers = await courseCovers();
  // The approved visitor wording (Membership-Page-Final.md, reviewer-approved
  // 8 October 2026), used exactly. Words in [ ] there are the buttons here.
  const link =
    "font-medium text-gold-text underline underline-offset-4 transition-colors hover:text-navy";
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <JsonLd data={COURSE_SCHEMA} />

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-text">
        Membership · US$19 a month
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Five Christian courses, one membership
      </h1>
      <p className="mt-3 text-lg text-muted" style={lede}>
        With Pastor Richmond Kobe
      </p>

      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        Practical, Scripture-centred guidance for seasons when you need help
        taking the next faithful step: through tiredness, worry, dating,
        marriage and your first years of church leadership. Learn at home, at
        your own pace, for US$19 a month. Cancel whenever you need to.
      </p>

      <JoinButton label="Join for US$19 a month" id="join" />

      <H2>Five complete courses</H2>
      {/* Each course with its book's cover, so the page shows what you join
          rather than only describing it (website audit V19). The words are the
          approved wording, unchanged. */}
      <ul className="mt-5 space-y-3">
        {COURSES.map((course) => {
          const cover = covers.get(course.book) ?? null;
          return (
            <li
              key={course.book}
              className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-3 pr-5"
            >
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md bg-sand">
                {cover && (
                  <Image src={cover} alt="" fill sizes="4rem" className="object-cover" />
                )}
              </div>
              <p className="leading-relaxed">
                <Bold>{course.title}</Bold>: {course.line}
              </p>
            </li>
          );
        })}
      </ul>

      <H2>Also included</H2>
      <ul className="mt-5 list-disc space-y-3 pl-6 leading-relaxed">
        <li>
          <Bold>One written question each month</Bold> to Pastor Richmond, with a
          personal written reply within three working days. This is not an
          ongoing counselling conversation.
        </li>
        <li>
          <Bold>A private journal</Bold> kept in your account. You can download it
          as a PDF at any time, and still read it after you cancel.
        </li>
        <li>
          <Bold>New courses as they are added,</Bold> at no extra cost.
        </li>
      </ul>

      <H2>How it works</H2>
      <p className="mt-5 leading-relaxed">
        {/* Changed at Richmond's request (8 October 2026) from "Join, and you
            are signed in straight away. After that, a six-digit code sent to
            your email opens your account on any device." */}
        Join, and a six-digit code is sent to your email to open your account.
        The same kind of code opens it on any device. There is no password to
        remember. Every course lets you go at your own pace, shorten a session
        or come back later.
      </p>

      <H2>A word of care</H2>
      <p className="mt-5 leading-relaxed">
        These courses are pastoral, not clinical. They are not a substitute for
        medical care, counselling or crisis support. If you are in danger or
        need more help, see{" "}
        <Link href={HELP_PATH} className={link}>
          Finding Help Where You Live
        </Link>
        .
      </p>

      <H2>Questions people ask</H2>
      <div className="mt-5 space-y-6">
        <Faq question="Can I cancel?">
          Yes, from your account in two clicks. You keep access until the end of
          your billing period.
        </Faq>
        <Faq question="Is there a refund?">
          Yes. Email info@faithfulpathcommunity.com within seven days of your
          first payment for a full refund.
        </Faq>
        <Faq question="Can my spouse and I join together?">
          Each person needs their own membership, so that each journal stays
          private.
        </Faq>
        <Faq question="Is counselling included?">
          The membership includes one written question a month. One-to-one
          sessions are a separate service: see{" "}
          <Link href="/talk-to-a-pastor" className={link}>
            Talk to a Pastor
          </Link>
          .
        </Faq>
        <div>
          <Faq question="Is the Following Jesus series included?">
            No. Following Jesus is a separate four-part discipleship pathway, so
            it is purchased separately rather than included in the monthly
            membership. It is US$29 per course, or US$89 for all four.
          </Faq>
          <Link
            href="/courses/following-jesus"
            className="mt-4 inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-7 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
          >
            See the series
          </Link>
        </div>
      </div>

      <JoinButton label="Join for US$19 a month" />
    </main>
  );
}
