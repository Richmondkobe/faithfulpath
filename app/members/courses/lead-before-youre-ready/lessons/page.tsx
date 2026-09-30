import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import {
  LBYR_LESSON_COUNT,
  LBYR_MODULES,
  LBYR_SLUG,
  lbyrFinishHref,
  lbyrConcernsHref,
  lbyrLessonHref,
  lbyrLessonSlug,
  lbyrStartHereHref,
  readLbyrLesson,
  requireLbyrPublished,
} from "@/lib/lbyr-course";
import LbyrShell, { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";
import LbyrProgress from "@/components/lbyr/LbyrProgress";

export const metadata: Metadata = {
  title: "Lead Before You’re Ready | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The course overview: Start Here, the ten lessons in order, and the Finish
 * page, with the pages that sit beside them.
 *
 * The hub the other two courses have. It is here rather than at the course's
 * base URL because that base redirects a member to wherever they are up to,
 * which is the entry the build brief asked for but is not somewhere to come
 * back to — once the course is finished it redirects to Finish, so a "Back to
 * the course overview" button pointing there reloaded the Finish page.
 */
export default async function LbyrOverview() {
  await requireActiveMember();
  requireLbyrPublished();

  const progress = await getCourseProgress(LBYR_SLUG);
  const done = (n: number) => Boolean(progress.get(lbyrLessonSlug(n))?.completed_at);
  const completed = Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => i + 1).filter(done).length;
  const allDone = completed === LBYR_LESSON_COUNT;

  return (
    <LbyrShell
      notice={readLbyrLesson(1).notice}
      eyebrow={
        <Link
          href="/members"
          className="text-[12px] uppercase tracking-[0.16em] text-[#8B5E34] underline underline-offset-4"
        >
          ← Your courses
        </Link>
      }
    >
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          A ten-lesson course
        </p>
        <h1
          className="mt-2 text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Lead Before You’re Ready
        </h1>
        <p className="mt-2 text-[19px] leading-snug text-[#6B5F53]">
          Practical pastoral training for your first year or two of leading in a
          church.
        </p>
        <LbyrProgress completed={completed} />
      </Panel>

      <Plain>
        <Link
          href={lbyrStartHereHref}
          className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
        >
          Start Here: Before You Begin
        </Link>
      </Plain>

      {LBYR_MODULES.map((mod) => (
        <Plain key={mod.label}>
          <SectionHeading>{mod.label}</SectionHeading>
          <ul className="mt-4 space-y-3">
            {mod.lessons.map((order) => {
              const lesson = readLbyrLesson(order);
              return (
                <li key={order}>
                  <Link
                    href={lbyrLessonHref(order)}
                    className="flex flex-wrap items-baseline gap-x-3 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 text-[#2B2118] transition-colors hover:border-[#8B5E34]"
                  >
                    <span className="text-[12px] uppercase tracking-[0.16em] text-[#8B5E34]">
                      Lesson {order}
                    </span>
                    <span className="text-[1.05rem]">{lesson.title}</span>
                    {done(order) && (
                      <span className="ml-auto text-[12px] uppercase tracking-[0.16em] text-[#8B5E34]">
                        Complete
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Plain>
      ))}

      {/* The Finish page, offered once every lesson is done — the same rule the
          course entry uses to send a member there. */}
      {allDone && (
        <Plain>
          <Link
            href={lbyrFinishHref}
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Finish: Lead Before You Feel Ready
          </Link>
        </Plain>
      )}

      <Plain>
        <p className="text-[15px]">
          <Link
            href={lbyrConcernsHref}
            className="text-[#8B5E34] underline underline-offset-4"
          >
            Concerns, Care and Reporting
          </Link>
        </p>
      </Plain>
    </LbyrShell>
  );
}
