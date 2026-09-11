import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findLesson,
  getCourse,
  getLessonBody,
  getLessons,
  getQuiz,
  lessonHref,
} from "@/lib/course";
import { getCourseProgress, getLessonReflections } from "@/lib/course-progress";
import Quiz from "@/components/course/Quiz";
import Reflection from "@/components/course/Reflection";
import MarkComplete from "@/components/course/MarkComplete";

export const metadata: Metadata = {
  title: "Lesson | Faithful Path Community",
  robots: { index: false, follow: false },
};

export default async function Lesson({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  await requireActiveMember();

  const { courseSlug, lessonSlug } = await params;
  const course = getCourse(courseSlug);
  const found = findLesson(courseSlug, lessonSlug);
  if (!course || !found) notFound();

  const { lesson, module: lessonModule } = found;
  const lessons = getLessons(courseSlug);
  const index = lessons.findIndex((l) => l.slug === lesson.slug);
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  const body = getLessonBody(courseSlug, lesson.file);
  const quiz = getQuiz(courseSlug, lesson.quiz);
  const reflectionPrompts = getQuiz(courseSlug, lesson.reflection)?.reflection ?? [];

  const progress = await getCourseProgress(courseSlug);
  const mine = progress.get(lesson.slug) ?? null;

  const savedReflections = reflectionPrompts.length
    ? Object.fromEntries(await getLessonReflections(courseSlug, lesson.slug))
    : {};

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href={`/members/courses/${courseSlug}`}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← {course.title}
      </Link>

      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {lessonModule.title} · Lesson {lesson.order} of {lessons.length}
      </p>

      <h1
        className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[2.75rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {lesson.title}
      </h1>

      {/* Same renderer as the articles: GFM tables, headings, lists and
          blockquotes already styled to the site. Passing the title drops the
          lesson file's own H1, which repeats it. */}
      <ArticleBody source={body} title={lesson.title} />

      {quiz && quiz.questions.length > 0 && (
        <Quiz
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          questions={quiz.questions}
          passMark={quiz.pass_mark ?? quiz.questions.length}
          bestScore={mine?.quiz_best_score ?? null}
          alreadyPassed={Boolean(mine?.quiz_passed)}
        />
      )}

      {reflectionPrompts.length > 0 && (
        <Reflection
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          prompts={reflectionPrompts}
          saved={savedReflections}
        />
      )}

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <MarkComplete
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          completed={Boolean(mine?.completed_at)}
        />
      </div>

      <nav className="mt-12 flex flex-wrap items-start justify-between gap-6 border-t border-[#E5D9C7] pt-8">
        {previous ? (
          <Link
            href={lessonHref(courseSlug, previous.slug)}
            className="group max-w-[45%] min-w-0"
          >
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              ← Previous
            </span>
            <span className="mt-1 block text-[#2B2118] transition-colors group-hover:text-[#8B5E34]">
              {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={lessonHref(courseSlug, next.slug)}
            className="group max-w-[45%] min-w-0 text-right"
          >
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              Next →
            </span>
            <span className="mt-1 block text-[#2B2118] transition-colors group-hover:text-[#8B5E34]">
              {next.title}
            </span>
          </Link>
        )}
      </nav>
    </main>
  );
}
