import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import {
  findPageBySlug,
  getCountingLessons,
  linkCourseReferences,
  readPageFile,
  splitChapter,
} from "@/lib/mind-course";
import { mindLessonHref, slugFromFile } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";

export const metadata: Metadata = {
  title: "When Your Mind Won't Rest | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

/**
 * The book chapter a lesson was drawn from, on a page of its own.
 *
 * The chapter has always been in the lesson's file; splitChapter lifts it out
 * of the body so it never renders inline underneath the lecture. For a while it
 * was not offered at all, which left it written and unreachable. It is offered
 * again here — as a page rather than a disclosure, because it is long, and
 * because a member who wants the whole teaching wants somewhere to read it
 * rather than somewhere to unfold it.
 *
 * It counts towards nothing. There is no finish button on this page and no
 * progress written by opening it: the lesson is finished on the lesson.
 */
export function generateStaticParams() {
  return getCountingLessons()
    .map((lesson) => slugFromFile(lesson.file))
    .map((slug) => ({ slug }));
}

export default async function MindLessonChapter({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const found = findPageBySlug(slug);
  if (!found) notFound();

  const file = readPageFile(found.page.file);
  if (!file) notFound();

  const { chapter } = splitChapter(file.body);
  const chapterNumber =
    typeof file.front.chapter === "number" ? file.front.chapter : null;
  // A lesson with no chapter has no page here, rather than an empty one.
  if (!chapter || !chapterNumber) notFound();

  const { page, module } = found;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-4 sm:pt-24">
      <Link
        href={mindLessonHref(slug)}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← {page.title}
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {module.title} · Complete chapter
      </p>

      <h1
        className="mt-2 text-[2rem] leading-[1.15] text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Chapter {chapterNumber}: {page.title}
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        Optional. This is the complete teaching from the book. You do not need
        to read it to finish the lesson.
      </p>

      <article className="mt-8">
        <MindMarkdown source={linkCourseReferences(chapter, page.file)} />
      </article>

      <p className="mt-12 border-t border-[#E5D9C7] pt-6">
        <Link
          href={mindLessonHref(slug)}
          className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          ← Back to {page.title}
        </Link>
      </p>
    </main>
  );
}
