import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import {
  LBYR_BASE,
  LBYR_LESSON_COUNT,
  lbyrLessonHref,
  readLbyrChapter,
  readLbyrLesson,
  requireLbyrPublished,
} from "@/lib/lbyr-course";
import LbyrShell, { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";

export const metadata: Metadata = {
  title: "Chapter | Lead Before You’re Ready",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => ({
    slug: String(i + 1).padStart(2, "0"),
  }));
}

/**
 * The book chapter a lesson was drawn from, as a page.
 *
 * Members only, and hidden with the rest of the course. The chapter is what the
 * book is sold for, so it is not served anywhere a signed-out reader can reach
 * — but it is served as HTML rather than as the book's PDF pages, so it reflows
 * on a phone like everything else here.
 *
 * The words are the book's, extracted rather than retyped, and
 * verify:lbyr:chapters compares them back page by page.
 */
export default async function LbyrChapterPage({ params }: Props) {
  await requireActiveMember();
  requireLbyrPublished();

  const { slug } = await params;
  const order = Number(slug);
  if (!Number.isInteger(order) || order < 1 || order > LBYR_LESSON_COUNT) notFound();

  const chapter = readLbyrChapter(order);
  if (!chapter) notFound();
  const lesson = readLbyrLesson(order);

  const title = chapter.blocks.find((b) => b.t === "title");
  const body = chapter.blocks.filter((b) => b.t !== "title");

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
          From the book · Lead Before You’re Ready
        </p>
        <h1
          className="mt-2 text-[clamp(1.8rem,5vw,2.4rem)] leading-[1.15] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {title ? title.c.map((r) => r.text).join("") : `Chapter ${chapter.chapter}`}
        </h1>
      </Panel>

      <Plain>
        {/* A list is a run of consecutive bullets, gathered so they render as
            one list rather than as separate one-item lists. */}
        {body.reduce<React.ReactNode[]>((out, block, i) => {
          if (block.t === "li") {
            const prev = body[i - 1];
            if (prev?.t === "li") return out;          // already taken below
            const run: typeof body = [];
            for (let j = i; j < body.length && body[j].t === "li"; j++) run.push(body[j]);
            out.push(
              <ul key={i} className="mt-4 list-disc space-y-2 pl-6 text-[18px] leading-relaxed">
                {run.map((item, k) => (
                  <li key={k}>
                    {item.c.map((r, m) =>
                      r.bold ? (
                        <strong key={m} className="font-medium text-[#2B2118]">{r.text}</strong>
                      ) : (
                        <span key={m}>{r.text}</span>
                      )
                    )}
                  </li>
                ))}
              </ul>
            );
            return out;
          }
          if (block.t === "h") {
            out.push(
              <h2
                key={i}
                className="mt-8 text-[1.5rem] leading-snug text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {block.c.map((r) => r.text).join("")}
              </h2>
            );
            return out;
          }
          out.push(
            <p key={i} className="mt-4 text-[18px] leading-relaxed">
              {block.c.map((r, m) =>
                r.bold ? (
                  <strong key={m} className="font-medium text-[#2B2118]">{r.text}</strong>
                ) : (
                  <span key={m}>{r.text}</span>
                )
              )}
            </p>
          );
          return out;
        }, [])}
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
          <Link
            href={`${lbyrLessonHref(order)}/worksheet`}
            className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
          >
            Open the worksheet
          </Link>
        </div>
      </Plain>
    </LbyrShell>
  );
}
