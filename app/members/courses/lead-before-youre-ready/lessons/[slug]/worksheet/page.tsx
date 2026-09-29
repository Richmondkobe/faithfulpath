import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import {
  LBYR_BASE,
  LBYR_LESSON_COUNT,
  lbyrLessonHref,
  readLbyrLesson,
  requireLbyrPublished,
} from "@/lib/lbyr-course";
import Blocks from "@/components/lbyr/Blocks";
import LbyrShell, { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";

export const metadata: Metadata = {
  title: "Worksheet | Lead Before You’re Ready",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => ({
    slug: String(i + 1).padStart(2, "0"),
  }));
}

/**
 * The lesson's worksheet, on a page of its own.
 *
 * The same content the lesson offers in its Go deeper accordion, which is the
 * book's Reflect and Act page for that chapter, already reviewed and already in
 * the preview files. Given a page of its own so it can be printed or kept open
 * beside the lesson, which is how the other two courses offer theirs.
 *
 * Nothing here is writable and nothing is stored. It is a page to read from and
 * answer somewhere else — on paper, or in a private file of the reader's own.
 */
export default async function LbyrWorksheet({ params }: Props) {
  await requireActiveMember();
  requireLbyrPublished();

  const { slug } = await params;
  const order = Number(slug);
  if (!Number.isInteger(order) || order < 1 || order > LBYR_LESSON_COUNT) notFound();

  const lesson = readLbyrLesson(order);

  return (
    <LbyrShell
      notice={lesson.notice}
      eyebrow={
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] uppercase tracking-[0.16em] text-[#8B5E34]">
          <Link href={lbyrLessonHref(order)} className="underline underline-offset-4">
            ← Lesson {order}: {lesson.title}
          </Link>
          <Link href={LBYR_BASE} className="underline underline-offset-4">
            Course overview
          </Link>
        </div>
      }
    >
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Worksheet · Lesson {order}
        </p>
        <h1
          className="mt-2 text-[clamp(1.8rem,5vw,2.4rem)] leading-[1.15] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Chapter {lesson.goDeeper.chapter}: Reflect and Act
        </h1>
        <p className="mt-2 text-[19px] leading-snug text-[#6B5F53]">
          {lesson.title}
        </p>
      </Panel>

      <Plain>
        <Blocks blocks={lesson.goDeeper.worksheet} />
        <p className="mt-8 text-[15px] leading-relaxed text-[#6B5F53]">
          Optional, and yours alone. You do not need to complete this to finish
          the lesson. There is nowhere here to type an answer and nothing is
          saved — print this page, or answer in a private format of your own.
        </p>
      </Plain>

      <Plain>
        <SectionHeading>When you are ready</SectionHeading>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href={lbyrLessonHref(order)}
            className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
          >
            Back to Lesson {order}
          </Link>
        </div>
      </Plain>
    </LbyrShell>
  );
}
