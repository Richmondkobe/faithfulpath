import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import {
  getTbymCourse,
  readTbymLesson,
  tbymLessonHref,
} from "@/lib/tbym-course";
import TbymMarkdown from "@/components/tbym/TbymMarkdown";
import TbymFooter from "@/components/tbym/TbymFooter";

export const metadata: Metadata = {
  title: "Talk Before You Marry | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getTbymCourse().lessons.map((lesson) => ({ slug: lesson.slug }));
}

/**
 * The lesson's worksheet, as a printable page.
 *
 * Deliberately not a form. The course stores nothing a learner writes, and the
 * worksheets are the part where the writing is most private — three subjects
 * you have been avoiding, what you are afraid will happen if you raise them.
 * So there is nowhere here to type: the page is to be printed, or saved as a
 * PDF from the browser's print dialogue, and filled in on paper or on the
 * learner's own device. Nothing on it is uploaded, and nothing is kept.
 */
export default async function TbymWorksheetPage({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const lesson = readTbymLesson(slug);
  if (!lesson) notFound();

  return (
    <>
    <main
      className="mx-auto max-w-[760px] px-4 pt-8 pb-14"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Link
        href={tbymLessonHref(lesson.slug)}
        className="text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)] underline underline-offset-4"
        style={{ fontFamily: "var(--font-tbym-mono)" }}
      >
        ← Lesson {lesson.order}: {lesson.title}
      </Link>

      <p
        className="mt-5 text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)]"
        style={{ fontFamily: "var(--font-tbym-mono)" }}
      >
        Worksheet
      </p>
      <h1
        className="mt-2 text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[var(--tb-ink)]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {lesson.worksheetTitle}
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-[var(--tb-mute)]">
        Print this page, or save it as a PDF from your browser, and complete it
        on paper or on your own device. There is nowhere to type here on
        purpose: nothing you write for this course is uploaded, and nothing is
        stored.
      </p>

      <div className="mt-8 text-[var(--tb-ink)]">
        <TbymMarkdown source={lesson.worksheet} />
      </div>

      <p className="mt-10 border-t border-[var(--tb-line)] pt-5">
        <Link
          href={tbymLessonHref(lesson.slug)}
          className="text-[15px] text-[var(--tb-accent)] underline underline-offset-4"
        >
          ← Back to Lesson {lesson.order}
        </Link>
      </p>
    </main>

    <TbymFooter variant="short" />
    </>
  );
}
