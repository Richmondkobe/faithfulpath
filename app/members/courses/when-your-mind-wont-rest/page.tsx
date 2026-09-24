import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveMember } from "@/lib/member-gate";
import {
  getMindCourse,
  getCountingLessons,
  getCheckins,
  checkinSlug,
} from "@/lib/mind-course";
import {
  getFinishedLessons,
  getJourneyProgress,
  getPageAnswers,
  CERT_NAME_INDEX,
} from "@/lib/mind-progress";
import CertificateBlock from "@/components/mind/CertificateBlock";
import {
  mindCheckinHref,
  mindJourneyHref,
  mindLeadersHref,
  mindLessonHref,
  slugFromFile,
  MIND_BASE,
} from "@/lib/mind-links";

export const metadata: Metadata = {
  title: "When Your Mind Won't Rest | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The course home.
 *
 * It deliberately does not drop a new member into Module 0. The manifest sets
 * out three ways in — the foundation course, the page for a mind that is
 * restless right now, and the thirty-day journey — and none of them is locked.
 * A member in distress should not have to walk an orientation module to reach
 * the page written for them.
 *
 * Progress is shown, but only as a description of where they have been. There
 * is nothing here to fall behind on.
 */
export default async function MindCourseHome() {
  await requireActiveMember();

  const course = getMindCourse();
  const lessons = getCountingLessons();
  const [finished, journey, certAnswers] = await Promise.all([
    getFinishedLessons(),
    getJourneyProgress(),
    getPageAnswers("certificate"),
  ]);

  const done = lessons.filter((l) => finished.get(slugFromFile(l.file))?.finished).length;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-14 sm:pt-24">
      <Link
        href="/members"
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← Members
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {course.title}
      </h1>
      <p
        className="mt-5 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        {course.subtitle}
      </p>
      <p className="mt-5 leading-relaxed">{course.promise}</p>

      {/* Said plainly and early, because the promise above could otherwise be
          read as more than it is. */}
      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        This course is pastoral formation. It is not a {course.promise_excludes.join(", a ")}.
      </p>

      {/* One way in. The course is a sequence, and asking a new member to
          choose between three of them before they have read anything made the
          first decision of the course a navigational one.

          The other two ways in are kept, quietly, below the button: the
          restless-now page is written for somebody who needs it this minute,
          and the journey has thirty days of its own. Neither should need the
          URL to reach. */}
      <div className="mt-12">
        <Link
          href={`${MIND_BASE}/start`}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          {done > 0 ? "Continue the course" : "Start the Course"}
        </Link>
        {done > 0 && (
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            {done} of {lessons.length} lessons finished
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {course.entry_points
            .filter((entry) => entry.id !== "foundation")
            .map((entry) => (
              <Link
                key={entry.id}
                href={
                  entry.id === "journey"
                    ? mindJourneyHref()
                    : mindLessonHref(slugFromFile(entry.opens))
                }
                className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                {entry.label}
              </Link>
            ))}
        </div>
      </div>

      <CertificateBlock
        savedName={(certAnswers.get(CERT_NAME_INDEX) ?? "").trim()}
        done={done}
        total={lessons.length}
        journeyReached30={journey.has(30)}
      />

      {/* The toolkit, linked from the course home as the manifest requires. */}
      <section className="mt-12 border-t border-[#E5D9C7] pt-8">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Your toolkit
        </h2>
        {course.downloads.map((download) => (
          <div key={download.file} className="mt-4">
            <Link
              href={`${MIND_BASE}/downloads/${slugFromFile(download.file).replace(/\.pdf$/, "")}`}
              prefetch={false}
              className="text-[15px] text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              {download.title ?? "Download the toolkit"} (PDF)
            </Link>
          </div>
        ))}
      </section>

      {/* The pauses and the Pattern Finder. Listed apart from the entry points
          because none of them is a way into the course — they are optional
          stops along it, and nothing depends on doing any of them. */}
      <section className="mt-12 border-t border-[#E5D9C7] pt-8">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Optional pauses along the way
        </h2>
        <ul className="mt-4 space-y-2">
          {getCheckins().map((checkin) => (
            <li key={checkin.file}>
              <Link
                href={mindCheckinHref(checkinSlug(checkin))}
                className="text-[15px] text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                {checkin.title}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6B5F53]">
          None of these is scored or required, and none of them affects finishing
          the course or your certificate.
        </p>
      </section>

      {/* Outside the learner pathway, and the manifest says so — it sits apart
          from the three entry points rather than among them. */}
      <div className="mt-12 border-t border-[#E5D9C7] pt-8">
        {course.course_home_links.map((link) => (
          <div key={link.id}>
            <Link
              href={mindLeadersHref()}
              className="text-[15px] font-medium text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              {link.label}
            </Link>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6B5F53]">
              {link.blurb}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
