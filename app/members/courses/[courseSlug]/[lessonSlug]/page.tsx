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
  getAudioScript,
  getSilenceLengths,
  getVideoScript,
  hasMedia,
  isCountable,
  lessonHref,
  resourceHref,
  spliceAtHeadings,
  suggestedSilenceMinutes,
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
import VideoBlock from "@/components/course/VideoBlock";
import AudioBlock from "@/components/course/AudioBlock";
import SilenceTimer from "@/components/course/SilenceTimer";
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

  const mediaUrl = (kind: "videos" | "audio", file: string) =>
    hasMedia(kind, file) ? `/course-media/${kind}/${file}` : null;

  // A single `video` sits above the Key Scripture box on a teaching lesson, and
  // above "Before you begin" on a session.
  const leadVideo = front.video ? getVideoScript(courseSlug, front.video) : null;
  const leadVideoBlock = leadVideo ? (
    <VideoBlock video={leadVideo} src={mediaUrl("videos", `${leadVideo.id}.mp4`)} />
  ) : // 00-welcome names a video that has no script file; its words are already
  // in the lesson body, so the placeholder alone is right there.
  front.video ? (
    <VideoPlaceholder />
  ) : null;

  const audio = front.audio ? getAudioScript(courseSlug, front.audio) : null;
  const silenceLengths = getSilenceLengths(courseSlug);
  const body = getLessonBody(courseSlug, lesson.file);
  const suggested = suggestedSilenceMinutes(body);

  const openingSrcFor = Object.fromEntries(
    [...new Set([...silenceLengths, ...(suggested ? [suggested] : [])])].map((n) => [
      n,
      mediaUrl("audio", `timer-opening-${n}.mp3`),
    ])
  );

  // Slots inside the body: the guided-prayer player, the silence timer, and any
  // Day 30 week videos that name the heading they belong above.
  const listedVideos = front.videos
    .map((id) => getVideoScript(courseSlug, id))
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const slots: { id: string; heading: string; where: "before" | "after" | "endOfSection" }[] = [];
  if (audio) slots.push({ id: "audio", heading: "## Guided prayer", where: "after" });
  // A session's lead video belongs above "Before you begin", which lives inside
  // the body rather than above it.
  if (lesson.type === "session" && leadVideo) {
    slots.push({ id: "leadVideo", heading: "## Before you begin", where: "before" });
  }
  if (lesson.type === "session") {
    slots.push({ id: "silence", heading: "## Silence", where: "endOfSection" });
  }
  for (const v of listedVideos) {
    if (v.beforeHeading) {
      slots.push({ id: `video:${v.id}`, heading: v.beforeHeading, where: "before" });
    }
  }

  const renderSlot = (id: string) => {
    if (id === "leadVideo" && leadVideo) {
      return (
        <VideoBlock
          key="leadVideo"
          video={leadVideo}
          src={mediaUrl("videos", `${leadVideo.id}.mp4`)}
        />
      );
    }
    if (id === "audio" && audio) {
      return <AudioBlock key="audio" audio={audio} src={mediaUrl("audio", `${audio.id}.mp3`)} />;
    }
    if (id === "silence") {
      return (
        <SilenceTimer
          key="silence"
          lengths={silenceLengths}
          suggested={suggested}
          openingSrcFor={openingSrcFor}
          closingSrc={mediaUrl("audio", "timer-closing.mp3")}
        />
      );
    }
    const video = listedVideos.find((v) => `video:${v.id}` === id);
    if (video) {
      return (
        <VideoBlock key={id} video={video} src={mediaUrl("videos", `${video.id}.mp4`)} />
      );
    }
    return null;
  };

  const renderBody = (source: string) => {
    const pieces = slots.length > 0 ? spliceAtHeadings(source, slots) : [{ kind: "markdown" as const, source }];
    return pieces.map((piece, i) =>
      piece.kind === "markdown" ? (
        <ArticleBody
          key={`md-${i}`}
          source={piece.source}
          remarkPlugins={remarkPlugins}
          components={routeComponents}
        />
      ) : (
        renderSlot(piece.id)
      )
    );
  };
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

      {/* A lead video sits above Key Scripture on a teaching lesson. On a
          session it belongs above "Before you begin", which is inside the body,
          so it is spliced in there instead. */}
      {isTeaching && leadVideoBlock}

      {isTeaching && sections.keyScripture && (
        <KeyScripture>
          <ArticleBody source={sections.keyScripture} remarkPlugins={remarkPlugins} />
        </KeyScripture>
      )}

      {/* Teaching lessons render the condensed "In brief"; sessions and
          reference lessons keep their single body, which is what `inBrief`
          holds when the headings are absent. */}
      {renderBody(isTeaching ? sections.inBrief : body)}

      {/* The box appears for downloads alone, on lessons that list no
          worksheets. */}
      {(front.resources.length > 0 || front.downloads.length > 0) && (
        <ResourcesBox
          courseSlug={courseSlug}
          slugs={front.resources}
          downloads={front.downloads}
        />
      )}

      {/* Lesson 28's week videos sit against headings inside the deeper
          teaching, so that body is spliced too. */}
      {isTeaching && sections.deeper && (
        <DeeperTeaching>{renderBody(sections.deeper)}</DeeperTeaching>
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
