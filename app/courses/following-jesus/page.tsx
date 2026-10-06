import type { Metadata } from "next";
import Link from "next/link";
import { COURSES, OFFERS, coursePath, offersOpenCourse, SERIES_PATH } from "@/lib/following-jesus";
import { getLearner, getOwnedOffers } from "@/lib/following-jesus-access";
import { formatPrice } from "@/lib/products";

const TITLE = "Following Jesus — Four Video Courses | Faithful Path Community";
const DESCRIPTION =
  "Four video courses with Pastor Richmond Kobe for the first steps of following Jesus: Begin, Establish, Grow and Multiply.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SERIES_PATH },
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const lede = { fontFamily: "var(--font-display)", fontWeight: 300 } as const;

export default async function FollowingJesusSeries() {
  const learner = await getLearner();
  const owned = learner ? await getOwnedOffers() : new Set<never>();
  const begin = OFFERS["following-jesus-begin"];
  const all = OFFERS["following-jesus-all-four"];

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
        The courses are sold on their own, separately from the membership: Begin is{" "}
        {formatPrice(begin.priceCents)}, or all four are {formatPrice(all.priceCents)}, each a
        one-time payment. All four opens each later course for you when it launches.
      </p>

      <ol className="mt-12 space-y-4">
        {COURSES.map((course) => {
          const open = offersOpenCourse(owned, course);
          return (
            <li
              key={course.slug}
              className={`rounded-sm border px-6 py-5 ${
                course.launched ? "border-[#D9CDBA] bg-white" : "border-[#E5D9C7] bg-[#F7F1E6]"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                Course {course.book} of 4
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 className="text-2xl text-[#2B2118]" style={heading}>
                  {course.title}
                </h2>
                {course.launched ? (
                  <Link
                    href={coursePath(course)}
                    className="text-[15px] font-medium text-[#8B5E34] underline underline-offset-4"
                  >
                    {open ? "Go to your course" : "See the course"} ›
                  </Link>
                ) : (
                  <span className="text-[15px] text-[#6B5F53]">Coming soon</span>
                )}
              </div>
              {course.launched && (
                <p className="mt-2 leading-relaxed text-[#6B5F53]">
                  {course.lessons.length} lessons for the first steps of following Jesus.
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
