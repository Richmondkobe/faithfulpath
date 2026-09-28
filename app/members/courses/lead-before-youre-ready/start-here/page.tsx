import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import {
  LBYR_SLUG,
  lbyrLessonHref,
  readLbyrLesson,
  readLbyrPage,
  requireLbyrPublished,
} from "@/lib/lbyr-course";
import Blocks from "@/components/lbyr/Blocks";
import LbyrShell, { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";
import LbyrProgress from "@/components/lbyr/LbyrProgress";

export const metadata: Metadata = {
  title: "Start Here | Lead Before You’re Ready",
  robots: { index: false, follow: false },
};

export default async function LbyrStartHere() {
  await requireActiveMember();
  requireLbyrPublished();

  const page = readLbyrPage("start-here");
  const lessonOne = readLbyrLesson(1);
  const progress = await getCourseProgress(LBYR_SLUG);
  const completed = [...progress.values()].filter((p) => p.completed_at).length;

  // The last section on the source page is the help block; the one before it is
  // "Ready to begin?", whose button is rendered here rather than parsed.
  const body = page.sections.filter(
    (s) => !/^Ready to begin/i.test(s.heading) && !/^Need help/i.test(s.heading)
  );
  const help = page.sections.find((s) => /^Need help/i.test(s.heading));
  const begin = page.sections.find((s) => /^Ready to begin/i.test(s.heading));

  return (
    <LbyrShell notice={lessonOne.notice}>
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          A ten-lesson course
        </p>
        <h1
          className="mt-2 text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {page.title}
        </h1>
        {page.sub && (
          <p className="mt-2 text-[19px] leading-snug text-[#6B5F53]">{page.sub}</p>
        )}
        <LbyrProgress completed={completed} />
      </Panel>

      {body.map((s, i) => (
        <Plain key={i}>
          {s.heading && <SectionHeading>{s.heading}</SectionHeading>}
          <Blocks blocks={s.blocks} />
        </Plain>
      ))}

      {/* Begin Lesson 1 opens the lesson directly — no welcome page in the way. */}
      <Panel>
        <SectionHeading>Ready to begin?</SectionHeading>
        <div className="mt-4">
          <Link
            href={lbyrLessonHref(1)}
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Begin Lesson 1: {lessonOne.title}
          </Link>
          {begin && (
            <div className="mt-3">
              <Blocks blocks={begin.blocks} />
            </div>
          )}
        </div>
      </Panel>

      {help && (
        <Plain>
          <SectionHeading>{help.heading}</SectionHeading>
          <Blocks blocks={help.blocks} />
        </Plain>
      )}
    </LbyrShell>
  );
}
