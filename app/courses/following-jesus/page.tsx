import type { Metadata } from "next";
import Link from "next/link";
import { COURSES, OFFERS, coursePath, offersOpenCourse, singleOfferFor, SERIES_LISTED, SERIES_PATH } from "@/lib/following-jesus";
import { getLearner, getOwnedOffers } from "@/lib/following-jesus-access";
import { formatPrice } from "@/lib/products";

const TITLE = "Following Jesus — Four Video Courses | Faithful Path Community";
const DESCRIPTION =
  "Four video courses with Pastor Richmond Kobe, from new life in Christ to helping others follow Jesus: Begin, Establish, Grow and Multiply.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SERIES_PATH },
  ...(SERIES_LISTED ? {} : { robots: { index: false, follow: false } }),
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const lede = { fontFamily: "var(--font-display)", fontWeight: 300 } as const;

export default async function FollowingJesusSeries() {
  const learner = await getLearner();
  const owned = learner ? await getOwnedOffers() : new Set<never>();
  const begin = OFFERS["following-jesus-begin"];
  const all = OFFERS["following-jesus-all-four"];
  // "Begin is US$29", or once Establish is listed, "Begin and Establish are
  // US$29 each". Every single course is the same price.
  const listedTitles = COURSES.filter((c) => c.launched && c.listed && singleOfferFor(c)).map((c) => c.title);
  const singles =
    listedTitles.length <= 1 ? listedTitles[0] : `${listedTitles.slice(0, -1).join(", ")} and ${listedTitles[listedTitles.length - 1]}`;
  const singlesVerb = listedTitles.length <= 1 ? "is" : "are";
  const each = listedTitles.length <= 1 ? "" : " each";

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">Video courses</p>
      <h1
        className="mt-3 text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={heading}
      >
        Following Jesus
      </h1>
      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        Four video courses with Pastor Richmond Kobe, one step at a time:
        Begin, Establish, Grow and Multiply. Each has short narrated lessons,
        a reading plan for the week, and a Leader&rsquo;s Guide for taking it
        with a group.
      </p>
      <p className="mt-4 leading-relaxed">
        The courses are sold on their own, separately from the membership: {singles} {singlesVerb}{" "}
        {formatPrice(begin.priceCents)}{each}, or all four are {formatPrice(all.priceCents)}, each a
        one-time payment.
        {/* Only while a course is still to come: once all four are listed
            there is no later course (Richmond, 8 October 2026). */}
        {COURSES.some((c) => !(c.launched && c.listed)) && " All four opens each later course for you when it launches."}
      </p>

      <ol className="mt-12 space-y-4">
        {COURSES.map((course) => {
          // On sale and pointed to; an unlisted course stays "Coming soon"
          // here even for someone who can already open it.
          const open = course.launched && course.listed;
          const yours = offersOpenCourse(owned, course);
          return (
            <li
              key={course.slug}
              className={`rounded-sm border px-6 py-5 ${
                open ? "border-[#D9CDBA] bg-white" : "border-[#E5D9C7] bg-[#F7F1E6]"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                Course {course.book} of 4
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 className="text-2xl text-[#2B2118]" style={heading}>
                  {course.title}
                  <span className="block text-lg text-[#6B5F53]">{course.subtitle}</span>
                </h2>
                {open ? (
                  <Link
                    href={coursePath(course)}
                    className="text-[15px] font-medium text-[#8B5E34] underline underline-offset-4"
                  >
                    {yours ? "Go to your course" : "See the course"} ›
                  </Link>
                ) : (
                  <span className="text-[15px] text-[#6B5F53]">Coming soon</span>
                )}
              </div>
              {open && (
                <p className="mt-2 leading-relaxed text-[#6B5F53]">
                  {course.seriesLine}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {!learner && (
        <p className="mt-10 text-sm text-[#6B5F53]">
          Already bought a course?{" "}
          <Link
            href={`${SERIES_PATH}/sign-in?next=${encodeURIComponent(SERIES_PATH)}`}
            className="underline underline-offset-4 hover:text-[#8B5E34]"
          >
            Sign in
          </Link>{" "}
          with the email you paid with.
        </p>
      )}
    </main>
  );
}
