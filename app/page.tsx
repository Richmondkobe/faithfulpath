import type { Metadata } from "next";
import { socialMeta } from "@/lib/social-meta";
import Image from "next/image";
// A fixed import: a hashed, long-cached file with its own size and a blurred
// placeholder, rather than a plain path re-checked on every visit (website
// audit P6).
import richmond from "@/public/richmond-1200.jpg";
import Link from "next/link";
import { SITE, COUNTRIES } from "@/lib/site";
import { listPublishedArticles } from "@/lib/articles-db";
import { OFFERS, SERIES_PATH } from "@/lib/following-jesus";
import { formatPrice } from "@/lib/products";

// The title and description are the root layout's, which were written for this
// page. Only the canonical is set here: without it the home page is reachable
// as itself and as any tracking-parameter variant, with nothing saying which is
// the real one.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  ...socialMeta({
    title: "Faithful Path Community — Online Pastoral Counselling & Spiritual Guidance",
    description:
      "Pastoral guidance online with a pastor of twenty years. Articles, teaching, and one-to-one conversations.",
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

export default async function Home() {
  const recent = (await listPublishedArticles()).slice(0, 3);
  const fjSingle = formatPrice(OFFERS["following-jesus-begin"].priceCents);
  const fjAll = formatPrice(OFFERS["following-jesus-all-four"].priceCents);

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-12 sm:grid-cols-[1.15fr_1fr]">
          <div>
            {/* Names the service in plain words above the headline, for
                readers and search engines alike (website audit S13). */}
            <p className="text-xs uppercase tracking-[0.18em] text-gold-text font-medium">
              Online Christian pastoral counselling
            </p>
            <h1
              className="mt-4 text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Some things you cannot work out alone.
            </h1>
            <p
              className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              I am Richmond — a pastor of more than twenty years, across ten
              countries. This is where I write, teach, and sit down with people
              one at a time.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/talk-to-a-pastor"
                className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
              >
                Talk to a Pastor — {SITE.price}
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-7 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
              >
                Read the articles
              </Link>
            </div>
          </div>
          <div className="sm:order-last">
            <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl sm:max-w-none">
              <Image
                src={richmond}
                placeholder="blur"
                alt="Richmond, pastor at Faithful Path Community"
                fill
                loading="eager"
                sizes="(max-width: 640px) 20rem, 24rem"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-text">
          Online course
        </p>
        <h2
          className="mt-4 text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          The Christian Spiritual Reset
        </h2>
        <p
          className="mt-5 max-w-xl text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Some seasons do not call for another book. They call for somewhere to
          stop.
        </p>
        <p className="mt-4 max-w-xl leading-relaxed">
          This is a guided retreat you take at home, at whatever pace your life
          allows — video teaching, guided prayers, timers to hold the silence
          for you, and printable workbooks, all read online. It opens with
          membership at US$19 a month, and you can stop whenever you need to.
        </p>
        {/* The hero's pair, in the same order and the same two styles: the
            primary goes straight to the Join button, the secondary to the page
            for someone still reading. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/membership#join"
            className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            Start the Spiritual Reset — US$19/month
          </Link>
          <Link
            href="/membership"
            className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-7 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text"
          >
            See what is included
          </Link>
        </div>
      </section>

      {/* Following Jesus, in the Spiritual Reset section's layout and button
          styles: the primary to the series, the secondary straight to Begin. */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-text">
          Video courses
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
          all four, sold separately from the membership.
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
          <p className="mt-10 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-muted font-medium">
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
              <p className="pt-1 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
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
