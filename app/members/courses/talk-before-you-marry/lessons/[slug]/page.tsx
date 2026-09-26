import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import { signedMediaUrl } from "@/lib/course-media";
import {
  getTbymCourse,
  nextTbymLesson,
  readTbymLesson,
  readTbymSlides,
  tbymLessonHref,
  tbymSafetyHref,
  tbymWorksheetHref,
  TBYM_BASE,
  TBYM_SLUG,
} from "@/lib/tbym-course";
import TbymMarkdown from "@/components/tbym/TbymMarkdown";
import TbymFooter from "@/components/tbym/TbymFooter";
import TbymRecording from "@/components/tbym/TbymRecording";
import TbymSlidePlayer, {
  type TbymSlide,
} from "@/components/tbym/TbymSlidePlayer";
import TbymFinishLesson from "@/components/tbym/TbymFinishLesson";

export const metadata: Metadata = {
  title: "Talk Before You Marry | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getTbymCourse().lessons.map((lesson) => ({ slug: lesson.slug }));
}

/** A shell with the course's label styling, used for every section. */
function Card({
  children,
  plain = false,
}: {
  children: React.ReactNode;
  plain?: boolean;
}) {
  return (
    <section
      className={`rounded-md px-6 py-7 ${
        plain
          ? "border border-transparent"
          : "border border-[var(--tb-line)] bg-[var(--tb-card)]"
      }`}
    >
      {children}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-3 text-[1.6rem] leading-tight text-[var(--tb-ink)]"
      style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
    >
      {children}
    </h2>
  );
}

export default async function TbymLessonPage({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const lesson = readTbymLesson(slug);
  if (!lesson) notFound();

  const course = getTbymCourse();
  const progress = await getCourseProgress(TBYM_SLUG);
  const finished = Boolean(progress.get(slug)?.completed_at);
  const doneCount = [...progress.values()].filter((p) => p.completed_at).length;

  // Null until a recording exists; the player says so rather than hiding.
  const audioSrc = lesson.audio
    ? await signedMediaUrl("audio", `${lesson.audio}.mp3`, TBYM_SLUG)
    : null;

  // A lesson with a slide lecture plays it; the rest show the plain player.
  const deck = readTbymSlides(lesson.order);

  const next = nextTbymLesson(lesson.order);

  return (
    <>
    <main
      className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-8 pb-14"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Stacked on a phone, side by side from 640px up. At 360px the two
          labels measure about 300px of the 328px available — inside the box,
          but close enough that a longer course title or "Lesson 14 of 14"
          would push one onto a line of its own, right-aligned and orphaned.
          Stacking below sm avoids that rather than waiting for it. */}
      <div
        className="flex flex-col gap-1 text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        style={{ fontFamily: "var(--font-tbym-mono)" }}
      >
        <Link href={TBYM_BASE} className="underline underline-offset-4">
          {course.title}
        </Link>
        <span>
          Lesson {lesson.order} of {course.lesson_count}
        </span>
      </div>

      {/* 1. Lesson title and Scripture */}
      <Card>
        <p
          className="text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)]"
          style={{ fontFamily: "var(--font-tbym-mono)" }}
        >
          Lesson {lesson.order}
        </p>
        <h1
          className="mt-3 text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[var(--tb-ink)]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {lesson.title}
        </h1>
        {lesson.subtitle && (
          <p
            className="mt-2 text-[1.3rem] leading-snug text-[var(--tb-mute)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lesson.subtitle}
          </p>
        )}
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--tb-track)]"
          role="img"
          aria-label={`${doneCount} of ${course.lesson_count} lessons complete`}
        >
          <span
            className="block h-full bg-[var(--tb-accent)]"
            style={{ width: `${(doneCount / course.lesson_count) * 100}%` }}
          />
        </div>
      </Card>

      <Card plain>
        <blockquote
          className="text-[1.3rem] leading-[1.5] text-[var(--tb-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          &ldquo;{lesson.scriptureText}&rdquo;
        </blockquote>
        <p
          className="mt-3 text-[13px] uppercase tracking-[0.1em] text-[var(--tb-accent)]"
          style={{ fontFamily: "var(--font-tbym-mono)", fontWeight: 500 }}
        >
          {lesson.scriptureRef}
        </p>
        {/* Where a lesson reads more than the quoted line, it says so here
            rather than letting the quote stand in for the passage. */}
        {lesson.scriptureNote && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--tb-mute)]">
            {lesson.scriptureNote}
          </p>
        )}
      </Card>

      {/* 2. Objectives */}
      <Card>
        <Heading>In this lesson, you will learn to:</Heading>
        <ul className="list-disc pl-[1.2em] leading-relaxed text-[var(--tb-ink)]">
          {lesson.objectives.map((objective) => (
            <li key={objective} className="mb-2 last:mb-0">
              {objective}
            </li>
          ))}
        </ul>
      </Card>

      {/* 3. Watch or listen, and 4. the transcript under it */}
      <Card>
        <Heading>Watch or listen</Heading>
        {/* Above the player, not below it: a note about listening privately is
            no use to somebody who has already pressed play. */}
        {lesson.listeningNote && (
          <p className="mb-4 text-[15px] leading-relaxed text-[var(--tb-mute)]">
            {lesson.listeningNote}
          </p>
        )}
        {deck ? (
          <>
            <TbymSlidePlayer
              slides={deck.slides as TbymSlide[]}
              timings={deck.timings}
              audioUrl={audioSrc}
              lessonTitle={lesson.title}
            />
            <p className="mt-3 text-sm text-[var(--tb-mute)]">
              {lesson.duration}
            </p>
          </>
        ) : (
          <TbymRecording
            src={audioSrc}
            duration={lesson.duration}
            lessonTitle={lesson.title}
          />
        )}

        <details className="mt-4 border-t border-[var(--tb-line)]">
          <summary
            className="flex cursor-pointer justify-between py-4 text-[13px] uppercase tracking-[0.14em] text-[var(--tb-accent)]"
            style={{ fontFamily: "var(--font-tbym-mono)", fontWeight: 500 }}
          >
            Read the transcript
          </summary>
          <div className="max-w-[65ch] pb-3 text-[var(--tb-ink)]">
            <TbymMarkdown source={lesson.transcript} />
          </div>
        </details>
      </Card>

      {/* 5. Take one step — one practice, shown as the stages it is worked in.
             The stages are a reading aid, not extra tasks: this is still the
             single step the template allows, and the numbers say the order,
             not a score. */}
      <Card>
        <Heading>Take one step</Heading>
        <div className="text-[var(--tb-ink)]">
          <TbymMarkdown source={lesson.takeOneStep.intro} />
        </div>

        {lesson.takeOneStep.stages.length > 0 && (
          <ol className="mt-6 space-y-5">
            {lesson.takeOneStep.stages.map((stage, i) => (
              <li
                key={stage.title}
                className="border-t border-[var(--tb-line)] pt-4"
              >
                <p
                  className="text-[13px] uppercase tracking-[0.14em] text-[var(--tb-accent)]"
                  style={{ fontFamily: "var(--font-tbym-mono)", fontWeight: 500 }}
                >
                  <span aria-hidden="true">{i + 1}. </span>
                  {stage.title}
                </p>
                <div className="mt-2 text-[var(--tb-ink)]">
                  <TbymMarkdown source={stage.body} />
                </div>
              </li>
            ))}
          </ol>
        )}

        {lesson.takeOneStep.closing && (
          <div className="mt-6 text-[var(--tb-mute)]">
            <TbymMarkdown source={lesson.takeOneStep.closing} />
          </div>
        )}
      </Card>

      {/* 6. If it helps, tell someone — omitted by design on Lessons 3, 7, 12 */}
      {lesson.tellSomeone && (
        <Card plain>
          <Heading>If it helps, tell someone</Heading>
          <div className="text-[var(--tb-ink)]">
            <TbymMarkdown source={lesson.tellSomeone} />
          </div>
        </Card>
      )}

      {/* 7. Go deeper — the chapter card is hidden while there is nowhere for
             it to go. Its number stays in the lesson's front matter, so
             writing a chapter_href brings the card and its sentence back with
             no change here. The two notes below are worded for whichever is
             showing rather than being written once for both. */}
      <Card>
        <Heading>Go deeper</Heading>
        <div className="flex flex-wrap gap-3">
          <Link
            href={tbymWorksheetHref(lesson.slug)}
            className="inline-flex items-center justify-center rounded-md border border-[var(--tb-ink)] px-6 py-3 text-[17px] text-[var(--tb-ink)]"
          >
            Open the worksheet: {lesson.worksheetTitle}
          </Link>
          {lesson.chapterHref && (
            <Link
              href={lesson.chapterHref}
              className="inline-flex items-center justify-center rounded-md border border-[var(--tb-ink)] px-6 py-3 text-[17px] text-[var(--tb-ink)]"
            >
              Complete chapter: {lesson.chapterLabel}
            </Link>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--tb-mute)]">
          {lesson.chapterHref
            ? "Both are optional. You do not need either one to finish the lesson."
            : "The worksheet is optional. You do not need it to finish the lesson."}{" "}
          The worksheet is yours to print or fill in on your own device; nothing
          you write on it is sent anywhere or stored here.
        </p>
      </Card>

      {/* 8. Let it settle — display only. There is no input on this page. */}
      <Card>
        <Heading>Let it settle</Heading>
        <ul className="list-disc pl-[1.2em]">
          {lesson.letItSettle.map((prompt) => (
            <li
              key={prompt}
              className="mb-2 text-[1.25rem] leading-[1.45] text-[var(--tb-ink)] last:mb-0"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {prompt}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-[var(--tb-mute)]">
          These questions are for prayer and thought. There is nowhere to type
          an answer, and nothing is saved.
        </p>
      </Card>

      {/* 9. Need more support? — before the completion block, never after */}
      <Card plain>
        <Heading>Need more support?</Heading>
        <div className="text-[var(--tb-ink)]">
          <TbymMarkdown source={lesson.needMoreSupport} />
        </div>
        <p className="mt-4">
          <Link
            href={tbymSafetyHref}
            className="text-[15px] text-[var(--tb-accent)] underline underline-offset-4"
          >
            Visit Safety and Support
          </Link>
        </p>
      </Card>

      {/* 10. Completion */}
      <TbymFinishLesson
        courseSlug={TBYM_SLUG}
        lessonSlug={lesson.slug}
        lessonOrder={lesson.order}
        finished={finished}
        stopHref="/members"
        hasChapter={Boolean(lesson.chapterHref)}
        completionMessage={lesson.completionMessage}
        courseHref={TBYM_BASE}
        nextResource={course.next_resource}
        next={
          next
            ? {
                href: tbymLessonHref(next.slug),
                order: next.order,
                title: next.title,
              }
            : null
        }
      />

      {/* 11. Footer links and citation notice. */}
    </main>

    <TbymFooter variant="short" />
    </>
  );
}
