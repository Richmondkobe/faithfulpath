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
  isCountable,
  lessonHref,
} from "@/lib/course";
import {
  getCourseProgress,
  getLessonReflections,
  getRoute,
} from "@/lib/course-progress";
import { remarkRelativeLessonLinks } from "@/lib/markdown-plugins";
import RouteChoiceButton from "@/components/course/RouteChoiceButton";
import VideoPlaceholder from "@/components/course/VideoPlaceholder";
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

  // Lesson-to-lesson links in the Markdown are relative; point them at this
  // course's pages.
  const coursePath = `/members/courses/${courseSlug}`;
  const remarkPlugins = [remarkRelativeLessonLinks(coursePath)];

  // On the route lesson, the two links whose text begins "I choose" become
  // buttons that record the choice on the way through. Everything else on the
  // page keeps the ordinary link styling.
  const chosenRoute = lesson.route_choice ? await getRoute(courseSlug) : null;
  const components = lesson.route_choice
    ? {
        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
          const label = String(
            Array.isArray(children) ? children.join("") : (children ?? "")
          );
          const route = /^I choose/i.test(label.trim())
            ? /quick/i.test(label)
              ? ("quick" as const)
              : ("guided" as const)
            : null;

          if (!route || !href) {
            return (
              <a
                href={href}
                className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                {children}
              </a>
            );
          }
          return (
            <RouteChoiceButton
              courseSlug={courseSlug}
              route={route}
              href={href}
              chosen={chosenRoute === route}
            >
              {children}
            </RouteChoiceButton>
          );
        },
      }
    : undefined;

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
        {/* The order from course.json, which is what the lessons themselves
            refer to ("read Lesson 24") and which stays put if the course is
            re-cut. No "of N": that count is the progress bar's job, and the two
            do not measure the same thing. A reference lesson has no number —
            it sits outside the sequence — so it shows its module alone. */}
        {isCountable(lesson)
          ? `${lessonModule.title} · Lesson ${lesson.order}`
          : lessonModule.title}
      </p>

      <h1
        className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[2.75rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {lesson.title}
      </h1>

      {lesson.video && <VideoPlaceholder />}

      {/* Same renderer as the articles: GFM tables, headings, lists and
          blockquotes already styled to the site. Passing the title drops the
          lesson file's own H1, which repeats it. */}
      <ArticleBody
        source={body}
        title={lesson.title}
        remarkPlugins={remarkPlugins}
        components={components}
      />

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
