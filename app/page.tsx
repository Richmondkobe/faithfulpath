import type { Metadata } from "next";
import { socialMeta } from "@/lib/social-meta";
import Image from "next/image";
// A fixed import: a hashed, long-cached file with its own size and a blurred
// placeholder, rather than a plain path re-checked on every visit (website
// audit P6).
import richmond from "@/public/richmond-kobe-portrait.webp";
import Link from "next/link";
import { SITE, COUNTRIES } from "@/lib/site";
import { listPublishedArticles } from "@/lib/articles-db";
import { OFFERS, SERIES_PATH } from "@/lib/following-jesus";
import { formatPrice } from "@/lib/products";
import { publicNextGathering } from "@/lib/public-gathering";
import NextGatheringTime from "@/components/community/NextGatheringTime";

// The title and description are the root layout's, which were written for this
// page. Only the canonical is set here: without it the home page is reachable
// as itself and as any tracking-parameter variant, with nothing saying which is
// the real one.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  ...socialMeta({
    title: "Faithful Path Community — Grow in Faith, Pray Together, Talk to a Pastor",
    description:
      "A free Christian community led by Pastor Richmond Kobe: teaching, prayer, a weekly online gathering, and one-to-one pastoral conversations.",
    path: "/",
  }),
};

// Matches /articles: revalidatePath on save keeps this fresh, and this is the
// backstop for rows edited directly in Supabase.
export const revalidate = 300;

const STAGES = [
  {
    label: "Before",
    title: "You write to me",
    body:
      "You answer a few questions in writing — where you are, what happened, what you're carrying. I read it and pray over it before we ever meet.",
  },
  {
    label: "The hour",
    title: "We talk",
    body:
      "Sixty minutes, face to face over video. Mostly I listen. Where scripture speaks to what you're facing, I'll bring it — plainly, not as a lecture.",
  },
  {
    label: "After",
    title: "I write back",
    body:
      "Within 24 hours: what I heard, passages to sit with, and two or three concrete next steps. Something to return to later.",
  },
];

// The three ways in (third-party website review, 27 October 2026): the free
// community first, then reading, then a private conversation.
const STEPS = [
  {
    label: "Explore faith",
    title: "Read and learn",
    body: "Free articles and teaching on the Bible, prayer and following Jesus, wherever you are in your faith.",
    href: "/articles",
    cta: "Read the articles",
  },
  {
    label: "Join the Free Community",
    title: "Pray and walk with others",
    body: "A prayer wall, a weekly gathering on Zoom, and your questions answered by Pastor Richmond. Free, with no card.",
    href: "/community",
    cta: "Join free",
  },
  {
    label: "Talk to a pastor",
    title: "A private conversation",
    body: "One honest hour over video, with written follow-up the next day. For what you cannot work out alone.",
    href: "/talk-to-a-pastor",
    cta: `Talk to a Pastor — ${SITE.price}`,
  },
];

export default async function Home() {
  const [recent, gathering] = await Promise.all([
    listPublishedArticles().then((all) => all.slice(0, 3)),
    publicNextGathering(),
  ]);
  const fjSingle = formatPrice(OFFERS["following-jesus-begin"].priceCents);
  const fjAll = formatPrice(OFFERS["following-jesus-all-four"].priceCents);

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-12 sm:grid-cols-[1.15fr_1fr]">
          <div>
            {/* Names the service in plain words above the headline, for
                readers and search engines alike (website audit S13). */}
            <p className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
              Faithful Path Community · Pastor Richmond Kobe
            </p>
            <h1
              className="mt-4 text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Walk with God, not on your own.
            </h1>
            <p
              className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              I am Richmond — a pastor of more than twenty years, across ten
              countries. Here we grow in faith, pray for one another and meet
              each week. And when you need it, I sit down with people one at a
              time.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/community"
                className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
              >
                Join the Free Community
              </Link>
              <Link
                href="/talk-to-a-pastor"
                className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-7 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
              >
                Talk to a Pastor — {SITE.price}
              </Link>
            </div>
          </div>
          <div className="sm:order-last">
            <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl sm:max-w-none">
              <Image
                src={richmond}
                placeholder="blur"
                alt="Pastor Richmond Kobe"
                fill
                loading="eager"
                sizes="(max-width: 640px) 20rem, 24rem"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="start-here" className="mx-auto max-w-5xl px-6 pb-16">
        <h2
          id="start-here"
          className="text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Where would you like to start?
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.label} className="flex flex-col rounded-2xl border border-line bg-paper p-6">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-text">{step.label}</p>
              <h3
                className="mt-3 text-xl text-navy"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {step.title}
              </h3>
              <p className="mt-2 flex-1 leading-relaxed">{step.body}</p>
              <Link
                href={step.href}
                className="mt-5 inline-flex min-h-11 items-center text-[15px] font-semibold text-gold-text underline-offset-4 hover:underline"
              >
                {step.cta} ›
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {gathering && (
        <section aria-labelledby="gathering" className="bg-navy">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-soft">The next gathering</p>
            <h2
              id="gathering"
              className="mt-4 text-3xl tracking-[-0.01em] text-sun sm:text-4xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {gathering.title}
            </h2>
            <p className="mt-4 text-lg text-sand">
              <NextGatheringTime iso={gathering.start} />
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-sand">
              One hour on Zoom: we pray, open the Bible together and hear a short teaching. New faces are always
              welcome, and you can join quietly with your camera off. Join the Free Community to get the Zoom link.
            </p>
            <Link
              href="/community"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
            >
              Join free
            </Link>
          </div>
        </section>
      )}

      <section className="border-y border-line bg-sand">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {[
              ["20", "years pastoring"],
              ["10", "countries"],
              ["1,000+", "people counselled"],
              ["18", "books written"],
            ].map(([figure, label]) => (
              <div key={label}>
                <dt
                  className="text-3xl text-navy sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  {figure}
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-muted">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-[13px] uppercase leading-relaxed tracking-[0.12em] text-muted font-medium">
            {COUNTRIES.join(" · ")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2
          className="text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          One honest hour
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed">
          A private conversation, online, wherever you are. No church membership
          required, and you do not have to arrive with faith intact.
        </p>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {STAGES.map((stage) => (
            <div
              key={stage.label}
              className="grid gap-2 py-6 sm:grid-cols-[5rem_1fr] sm:gap-6"
            >
              <p className="pt-1 text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
                {stage.label}
              </p>
              <div>
                <h3
                  className="text-xl text-navy"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {stage.title}
                </h3>
                <p className="mt-2 max-w-2xl leading-relaxed">{stage.body}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/talk-to-a-pastor"
          className="mt-10 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          See how it works
        </Link>
      </section>

      <div className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 pt-14">
          <h2
            className="text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Courses
          </h2>
        </div>
      {/* The membership as it is today (Richmond, 26 October 2026): five
          courses, not the Spiritual Reset alone. */}
      <section className="mx-auto max-w-5xl px-6 pt-14 pb-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-text">
          Course Membership
        </p>
        <h2
          className="mt-4 text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Five Christian courses, US$19 a month
        </h2>
        <p
          className="mt-5 max-w-xl text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Learn at home, at your own pace, with Pastor Richmond.
        </p>
        <p className="mt-4 max-w-xl leading-relaxed">
          Spiritual burnout, worry and overthinking, Christian dating, preparing
          for marriage, and church leadership: each course has video teaching,
          guided prayers and workbooks. US$19 a month, cancel any time.
        </p>
        <div className="mt-8">
          <Link
            href="/membership"
            className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            See the Course Membership
          </Link>
        </div>
      </section>

      {/* Following Jesus, in the membership section's layout and button
          styles: the primary to the series, the secondary straight to Begin. */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-text">
          One-time purchase
        </p>
        <h2
          className="mt-4 text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Following Jesus
        </h2>
        <p
          className="mt-5 max-w-xl text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Four video courses, one step at a time, from new life in Christ to
          helping others follow Jesus.
        </p>
        <p className="mt-4 max-w-xl leading-relaxed">
          Begin, Establish, Grow and Multiply: short narrated lessons with
          captions, a reading plan for each week, and a Leader&rsquo;s Guide for
          taking each course with a group. {fjSingle} a course, or {fjAll} for
          all four, sold separately from the Course Membership.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={SERIES_PATH}
            className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            See the four courses
          </Link>
          <Link
            href={`${SERIES_PATH}/begin`}
            className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-7 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
          >
            Start with Begin — {fjSingle}
          </Link>
        </div>
      </section>

      </div>

      <section className="border-t border-line bg-sand">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2
            className="text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Writing and teaching
          </h2>
          {recent.length === 0 ? (
            <p className="mt-6 max-w-xl leading-relaxed text-muted">
              Articles are on their way.
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {recent.map((a) => (
                <li key={a.slug} className="py-6">
                  <Link href={"/articles/" + a.slug} className="group block">
                    <h3
                      className="text-xl text-navy transition-colors group-hover:text-gold-text"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                    >
                      {a.title}
                    </h3>
                    <p className="mt-2 max-w-2xl leading-relaxed">{a.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/articles"
            className="mt-8 inline-flex min-h-11 items-center text-[15px] font-medium text-gold-text underline-offset-4 hover:underline"
          >
            All articles
          </Link>
        </div>
      </section>
    </main>
  );
}
