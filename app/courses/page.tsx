import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, graph } from "@/lib/schema";
import { socialMeta } from "@/lib/social-meta";
import Link from "next/link";
import { OFFERS, SERIES_PATH } from "@/lib/following-jesus";
import { formatPrice } from "@/lib/products";
import { LBYR_NEW_LIVE } from "@/lib/lbyr-new-live";
import { SITE } from "@/lib/site";

// Lead Before You're Ready's Welcome page, open to anyone. A whole HTML page,
// not a React one, so a plain link rather than <Link>.
const LBYR_WELCOME = "/members/courses/lead-before-youre-ready-new/welcome";

// The page behind the menu's "Courses": the site's two kinds of course side by
// side, so a visitor can find Following Jesus without being sent the link
// (Richmond, 8 October 2026). The membership's own page is unchanged and one
// click on.

const TITLE = "Courses";
const DESCRIPTION =
  "Ways to grow with Pastor Richmond Kobe: the Free Community, the Course Membership (five courses, US$19 a month), the Following Jesus video courses and one-to-one Pastoral Conversations.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/courses" },
  ...socialMeta({ title: "Courses with Pastor Richmond Kobe", description: DESCRIPTION, path: "/courses" }),
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const lede = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const primary =
  "inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft";

function Course({
  kicker,
  title,
  line,
  body,
  href,
  button,
  items,
}: {
  kicker: string;
  title: string;
  line?: string;
  body: string;
  href: string;
  button: string;
  /** Courses listed in the card, as [name, one line, and where its name links, if anywhere]. */
  items?: [string, string, string?][];
}) {
  return (
    <li className="rounded-2xl border border-line bg-paper px-6 py-7 sm:px-8">
      {/* Bold and a deeper gold (8:1), so the label reads easily at both sizes. */}
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-text">{kicker}</p>
      <h2 className="mt-3 text-3xl tracking-[-0.01em] text-navy" style={heading}>
        {title}
      </h2>
      {line && (
        <p className="mt-4 max-w-xl text-lg leading-relaxed" style={lede}>
          {line}
        </p>
      )}
      <p className={`${line ? "mt-3" : "mt-4"} max-w-xl leading-relaxed`}>{body}</p>
      {items && (
        <ul className="mt-5 max-w-xl list-disc space-y-2 pl-6 leading-relaxed marker:text-gold-text">
          {items.map(([name, text, link]) => (
            <li key={name}>
              {link ? (
                <a href={link} className="font-medium text-navy underline underline-offset-4 transition-colors hover:text-gold-text">
                  {name}
                </a>
              ) : (
                <strong className="font-medium text-navy">{name}</strong>
              )}
              : {text}
            </li>
          ))}
        </ul>
      )}
      <Link href={href} className={`mt-7 ${primary}`}>
        {button}
      </Link>
    </li>
  );
}

// The four ways to take part, side by side (third-party website review,
// 27 October 2026). Every line repeats what the offering's own page and terms
// already say: nothing here is promised for the first time.
type Way = { name: string; href: string; cells: string[] };
const ROWS = ["Price", "How you pay", "What you get", "Questions to Pastor Richmond", "If you stop"];

function ways(fjSingle: string, fjAll: string): Way[] {
  return [
    {
      name: "Free Community",
      href: "/community",
      cells: [
        "Free",
        "Nothing to pay, no card",
        "The Prayer Wall, the Weekly Gathering on Zoom, and Ask Pastor Richmond",
        "Ask on the community board. Pastor Richmond answers there, for everyone to read (first name or anonymous)",
        "Leave whenever you like",
      ],
    },
    {
      name: "Course Membership",
      href: "/membership",
      cells: [
        "US$19 a month",
        "Monthly. Cancel any time; full refund within 7 days of your first payment",
        "Five courses, a private journal, new courses as they are added, and the Free Community",
        "One private written question a month, with a personal reply within three working days",
        "Access until the end of your billing period. You can still read your journal",
      ],
    },
    {
      name: "Following Jesus",
      href: SERIES_PATH,
      cells: [
        `${fjSingle} a course, or ${fjAll} for all four`,
        "One-time payment, no subscription",
        "Narrated video lessons with captions, a reading plan, worksheets, and a Leader's Guide for groups",
        "Not included",
        "Nothing to cancel: the courses stay in your account",
      ],
    },
    {
      name: "Pastoral Conversation",
      href: "/talk-to-a-pastor",
      cells: [
        `${SITE.price} a session`,
        "Pay for each session. Reschedule or cancel free up to 24 hours before",
        "A written intake, one hour together over video, and a written follow-up within 24 hours",
        "The whole hour is private and one to one",
        "Nothing to cancel: book again whenever you need",
      ],
    },
  ];
}

function Comparison({ fjSingle, fjAll }: { fjSingle: string; fjAll: string }) {
  const list = ways(fjSingle, fjAll);
  return (
    <section aria-labelledby="compare" className="mt-14 max-w-none!">
      <h2 id="compare" className="text-3xl tracking-[-0.01em] text-navy" style={heading}>
        Four ways to take part
      </h2>
      <p className="mt-4 leading-relaxed">
        Start free, and add a course or a conversation when you need one. Each is separate: joining one does not sign
        you up for another.
      </p>

      {/* Wide screens: one table. */}
      <div className="mt-8 hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full table-fixed border-collapse text-left text-[15px] leading-relaxed">
          <caption className="sr-only">The four ways to take part, compared</caption>
          <thead className="bg-sand">
            <tr>
              <td className="w-[16%] p-4" />
              {list.map((w) => (
                <th key={w.name} scope="col" className="p-4 align-top">
                  <Link href={w.href} className="text-lg text-navy underline-offset-4 hover:text-gold-text hover:underline" style={heading}>
                    {w.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row} className="border-t border-line bg-paper">
                <th scope="row" className="p-4 align-top text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-text">
                  {row}
                </th>
                {list.map((w) => (
                  <td key={w.name} className={`p-4 align-top ${i === 0 ? "font-semibold text-navy" : ""}`}>
                    {w.cells[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card for each. */}
      <ul className="mt-8 space-y-4 md:hidden">
        {list.map((w) => (
          <li key={w.name} className="rounded-2xl border border-line bg-paper p-5">
            <h3 className="text-xl text-navy" style={heading}>
              <Link href={w.href} className="underline-offset-4 hover:text-gold-text hover:underline">
                {w.name}
              </Link>
            </h3>
            <dl className="mt-3 space-y-3 text-[15px] leading-relaxed">
              {ROWS.map((row, i) => (
                <div key={row}>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gold-text">{row}</dt>
                  <dd className={i === 0 ? "font-semibold text-navy" : ""}>{w.cells[i]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Courses() {
  const single = formatPrice(OFFERS["following-jesus-begin"].priceCents);
  const all = formatPrice(OFFERS["following-jesus-all-four"].priceCents);

  return (
    <main className="mx-auto max-w-5xl px-6 [&>*]:max-w-3xl [&_p]:max-w-[40rem] pt-16 pb-20 sm:pt-24">
      <JsonLd data={graph(breadcrumbs([{ name: "Home", path: "/" }, { name: "Courses" }]))} />
      {/* No "Online courses" label above: it only repeated the heading (website audit V22). */}
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
        style={heading}
      >
        Courses
      </h1>
      {/* A little wider than the page's 640px paragraphs, so this one short
          sentence sits on one line (Richmond, 17 October 2026). */}
      <p className="mt-6 max-w-[45rem]! text-lg leading-relaxed" style={lede}>
        Two ways to learn with Pastor Richmond Kobe, online and at your own pace.
      </p>

      <ul className="mt-12 space-y-6">
        <Course
          kicker="Course Membership · US$19 a month"
          // The approved membership page's heading and opening paragraph
          // (Richmond, 8 October 2026).
          title="Five Christian courses, one membership"
          body="Practical, Scripture-centred guidance for seasons when you need help taking the next faithful step: through tiredness, worry, dating, marriage and your first years of church leadership. Learn at home, at your own pace, for US$19 a month. Cancel whenever you need to."
          href="/membership"
          button="See the Course Membership"
          // The five courses, in the approved membership page's own words
          // (Membership-Page-Final.md, reviewer-approved 8 October 2026).
          items={[
            ["The Christian Spiritual Reset", "a guided retreat at home for burnout and spiritual dryness."],
            ["When Your Mind Won’t Rest", "overthinking, worry and fear."],
            ["Before You Say Yes", "discernment in dating and the decision to marry."],
            ["Talk Before You Marry", "fifteen lessons for couples before marriage."],
            ["Lead Before You’re Ready", "for your first years of leading in a church.", LBYR_NEW_LIVE ? LBYR_WELCOME : undefined],
          ]}
        />
        <Course
          kicker={`Sold separately · ${single} a course`}
          title="Following Jesus"
          line="Four video courses, one step at a time, from new life in Christ to helping others follow Jesus."
          body={`Begin, Establish, Grow and Multiply: short narrated lessons with captions, a reading plan for each week, and a Leader's Guide for taking each course with a group. ${single} a course, or ${all} for all four, sold separately from the Course Membership.`}
          href={SERIES_PATH}
          button="See the four courses"
        />
      </ul>

      <Comparison fjSingle={single} fjAll={all} />
    </main>
  );
}
