import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findLesson,
  getCourse,
  getLessonBody,
  getLessonFront,
  getLessonSections,
  getLessons,
  getQuiz,
  isCountable,
  lessonHref,
  resourceHref,
} from "@/lib/course";
import {
  day30Available,
  getCourseProgress,
  getLessonReflections,
  getRoute,
  readCheckin,
  readDay30,
  readFollowup,
  DAY30_MS,
} from "@/lib/course-progress";
import { remarkRelativeLessonLinks } from "@/lib/markdown-plugins";
import Quiz from "@/components/course/Quiz";
import Reflection from "@/components/course/Reflection";
import MarkComplete from "@/components/course/MarkComplete";
import RouteChoiceButton from "@/components/course/RouteChoiceButton";
import VideoPlaceholder from "@/components/course/VideoPlaceholder";
import KeyScripture from "@/components/course/KeyScripture";
import DeeperTeaching from "@/components/course/DeeperTeaching";
import ResourcesBox from "@/components/course/ResourcesBox";
import NextStep from "@/components/course/NextStep";
import Day30Stage from "@/components/course/Day30Stage";
import CheckinRuleBased from "@/components/course/CheckinRuleBased";
import CheckinSafety from "@/components/course/CheckinSafety";
import CheckinIntegration from "@/components/course/CheckinIntegration";
import SafetyLink from "@/components/course/SafetyLink";
import CourseFooter from "@/components/course/CourseFooter";

export const metadata: Metadata = {
  title: "Lesson | Faithful Path Community",
  robots: { index: false, follow: false },
};

/** Lessons that carry the persistent help link, per the content's safety notes. */
const SAFETY_HEADER_ORDERS = new Set([4, 5, 24, 27, 28, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);

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

  const front = getLessonFront(courseSlug, lesson.file);
  const sections = getLessonSections(courseSlug, lesson.file);
  const quiz = getQuiz(courseSlug, lesson.quiz);
  const checkin = quiz?.checkin ?? null;
  const reflectionPrompts = getQuiz(courseSlug, lesson.reflection)?.reflection ?? [];

  const [progress, reflections] = await Promise.all([
    getCourseProgress(courseSlug),
    getLessonReflections(courseSlug, lesson.slug),
  ]);
  const mine = progress.get(lesson.slug) ?? null;
  const checkinState = readCheckin(reflections);
  const day30 = readDay30(reflections);

  // Only the saved outcome drives the page, never anything the browser asserts.
  const matched = checkinState?.outcome
    ? (checkin?.guidance ?? []).find((g) => g.id === checkinState.outcome) ?? null
    : null;
  const blockContinue = Boolean(matched?.block_continue);
  const hideAction = Boolean(matched?.hide_action);
  const replacePrimary = matched?.replace_primary ? matched.cta ?? null : null;

  const isTeaching = lesson.type === "teaching";
  const showSafetyLink = SAFETY_HEADER_ORDERS.has(lesson.order);
  const hasDay30 = Boolean(front.final_action && front.final_done);
  const day30Open = hasDay30 && day30Available(mine?.completed_at, day30);
  const opensOn = mine?.completed_at
    ? new Date(new Date(mine.completed_at).getTime() + DAY30_MS).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  const coursePath = `/members/courses/${courseSlug}`;
  const remarkPlugins = [remarkRelativeLessonLinks(coursePath)];
  const chosenRoute = lesson.route_choice ? await getRoute(courseSlug) : null;
  const routeComponents = lesson.route_choice
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

  const checkinBlock = checkin && (
    <>
      {checkin.type === "safety" ? (
        <CheckinSafety
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          checkin={checkin}
          savedAnswers={checkinState?.answers ?? null}
          savedPath={checkinState?.path ?? null}
          savedConfirmed={Boolean(checkinState?.confirmed)}
        />
      ) : checkin.type === "integration" ? (
        day30Open && (
          <CheckinIntegration
            courseSlug={courseSlug}
            lessonSlug={lesson.slug}
            checkin={checkin}
            savedAnswers={checkinState?.answers ?? null}
            savedConfirmed={Boolean(checkinState?.confirmed)}
          />
        )
      ) : (
        <CheckinRuleBased
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          checkin={checkin}
          savedAnswers={checkinState?.answers ?? null}
          savedOutcome={checkinState?.outcome ?? null}
        />
      )}
    </>
  );

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={coursePath}
          className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
        >
          ← {course.title}
        </Link>
        {showSafetyLink && <SafetyLink courseSlug={courseSlug} />}
      </div>

      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
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

      {front.outcome && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            What this lesson will do for you
          </p>
          <p
            className="mt-2 text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            {front.outcome}
          </p>
        </div>
      )}

      {lesson.video && <VideoPlaceholder />}

      {isTeaching && sections.keyScripture && (
        <KeyScripture>
          <ArticleBody source={sections.keyScripture} remarkPlugins={remarkPlugins} />
        </KeyScripture>
      )}

      {/* Teaching lessons render the condensed "In brief"; sessions and
          reference lessons keep their single body, which is what `inBrief`
          holds when the headings are absent. */}
      <ArticleBody
        source={isTeaching ? sections.inBrief : getLessonBody(courseSlug, lesson.file)}
        title={isTeaching ? undefined : lesson.title}
        remarkPlugins={remarkPlugins}
        components={routeComponents}
      />

      {front.resources.length > 0 && (
        <ResourcesBox courseSlug={courseSlug} slugs={front.resources} />
      )}

      {isTeaching && sections.deeper && (
        <DeeperTeaching>
          <ArticleBody source={sections.deeper} remarkPlugins={remarkPlugins} />
        </DeeperTeaching>
      )}

      {/* Lesson 28 only: the Day 30 stage sits immediately before its check-in. */}
      {hasDay30 && front.final_action && front.final_done && (
        <Day30Stage
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          finalAction={front.final_action}
          finalDoneLabel={front.final_done}
          available={day30Open}
          finalDone={Boolean(day30?.finalDone)}
          opensOn={opensOn}
        />
      )}

      {checkinBlock}

      {/* The retired multiple-choice quiz. Every set is empty in the current
          content, so this renders nothing; the component is kept for later. */}
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

      {front.action && front.action_done && !hideAction && (
        <NextStep
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          action={front.action}
          actionDone={front.action_done}
          followup={front.action_followup}
          completed={Boolean(mine?.completed_at)}
          savedFollowup={readFollowup(reflections)}
        />
      )}

      {/* Sessions and reference lessons have no "next step", so they keep the
          plain completion button. Reference lessons need it too: the quick
          route runs through Lesson 23, which is a reference lesson, and without
          a way to tick it off Continue would stop there for good. */}
      {!front.action_done && (
        <div className="mt-16 border-t border-[#E5D9C7] pt-10">
          <MarkComplete
            courseSlug={courseSlug}
            lessonSlug={lesson.slug}
            completed={Boolean(mine?.completed_at)}
          />
        </div>
      )}

      {reflectionPrompts.length > 0 && (
        <Reflection
          courseSlug={courseSlug}
          lessonSlug={lesson.slug}
          prompts={reflectionPrompts}
          saved={Object.fromEntries(
            [...reflections].filter(([i]) => i < reflectionPrompts.length)
          )}
        />
      )}

      <nav className="mt-12 flex flex-wrap items-start justify-between gap-6 border-t border-[#E5D9C7] pt-8">
        {previous ? (
          <Link href={lessonHref(courseSlug, previous.slug)} className="group max-w-[45%] min-w-0">
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

        {/* The readiness "urgent" outcome hides the way onward and offers help
            instead. Discernment's danger outcome swaps the button but leaves
            the course open. */}
        {blockContinue ? (
          <Link
            href={`${coursePath}/00-finding-help-where-you-live`}
            className="inline-flex items-center justify-center rounded-sm bg-[#8B3A2E] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#6F2E24]"
          >
            Finding help where you live
          </Link>
        ) : replacePrimary ? (
          <Link
            href={
              replacePrimary.resource
                ? resourceHref(courseSlug, replacePrimary.resource)
                : `${coursePath}/${replacePrimary.lesson ?? ""}`
            }
            className="inline-flex items-center justify-center rounded-sm bg-[#8B3A2E] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#6F2E24]"
          >
            {replacePrimary.text}
          </Link>
        ) : (
          next && (
            <Link href={lessonHref(courseSlug, next.slug)} className="group max-w-[45%] min-w-0 text-right">
              <span className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                Next →
              </span>
              <span className="mt-1 block text-[#2B2118] transition-colors group-hover:text-[#8B5E34]">
                {next.title}
              </span>
            </Link>
          )
        )}
      </nav>

      <CourseFooter courseSlug={courseSlug} />
    </main>
  );
}
