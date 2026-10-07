import type { Metadata } from "next";
import Link from "next/link";
import { OFFERS, SERIES_PATH } from "@/lib/following-jesus";
import { formatPrice } from "@/lib/products";

// The page behind the menu's "Courses": the site's two kinds of course side by
// side, so a visitor can find Following Jesus without being sent the link
// (Richmond, 8 October 2026). The membership's own page is unchanged and one
// click on.

const TITLE = "Courses | Faithful Path Community";
const DESCRIPTION =
  "Online courses with Pastor Richmond Kobe: The Christian Spiritual Reset, with the membership, and the four Following Jesus video courses.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/courses" },
  openGraph: { type: "website", url: "/courses", siteName: "Faithful Path Community", title: TITLE, description: DESCRIPTION },
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const lede = { fontFamily: "var(--font-display)", fontWeight: 300 } as const;
const primary =
  "inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]";

function Course({
  kicker,
  title,
  line,
  body,
  href,
  button,
}: {
  kicker: string;
  title: string;
  line: string;
  body: string;
  href: string;
  button: string;
}) {
  return (
    <li className="rounded-sm border border-[#D9CDBA] bg-white px-6 py-7 sm:px-8">
      {/* Bold and a deeper gold (8:1), so the label reads easily at both sizes. */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B4724]">{kicker}</p>
      <h2 className="mt-3 text-3xl tracking-[-0.01em] text-[#2B2118]" style={heading}>
        {title}
      </h2>
      <p className="mt-4 max-w-xl text-lg leading-relaxed" style={lede}>
        {line}
      </p>
      <p className="mt-3 max-w-xl leading-relaxed">{body}</p>
      <Link href={href} className={`mt-7 ${primary}`}>
        {button}
      </Link>
    </li>
  );
}

export default function Courses() {
  const single = formatPrice(OFFERS["following-jesus-begin"].priceCents);
  const all = formatPrice(OFFERS["following-jesus-all-four"].priceCents);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">Online courses</p>
      <h1
        className="mt-3 text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={heading}
      >
        Courses
      </h1>
      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        Two ways to learn with Pastor Richmond Kobe, online and at your own pace.
      </p>

      <ul className="mt-12 space-y-6">
        <Course
          kicker="With the membership · US$19 a month"
          title="The Christian Spiritual Reset"
          line="Some seasons do not call for another book. They call for somewhere to stop."
          body="A guided retreat you take at home, at whatever pace your life allows: video teaching, guided prayers, timers to hold the silence for you, and printable workbooks, all read online. It opens with membership at US$19 a month, and you can stop whenever you need to."
          href="/membership"
          button="See the membership"
        />
        <Course
          kicker={`Sold separately · ${single} a course`}
          title="Following Jesus"
          line="Four video courses, one step at a time, from new life in Christ to helping others follow Jesus."
          body={`Begin, Establish, Grow and Multiply: short narrated lessons with captions, a reading plan for each week, and a Leader's Guide for taking each course with a group. ${single} a course, or ${all} for all four, sold separately from the membership.`}
          href={SERIES_PATH}
          button="See the four courses"
        />
      </ul>
    </main>
  );
}
