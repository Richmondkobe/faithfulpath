import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import { signedMediaUrl } from "@/lib/course-media";
import {
  LBYR_BASE,
  LBYR_LESSON_COUNT,
  LBYR_SLUG,
  lbyrFinishHref,
  lbyrLessonHref,
  lbyrLessonSlug,
  LBYR_WIRED,
  readLbyrLesson,
  readLbyrSlides,
  requireLbyrPublished,
} from "@/lib/lbyr-course";
import Blocks, { Inlines } from "@/components/lbyr/Blocks";
import LbyrShell, { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";
import LbyrProgress from "@/components/lbyr/LbyrProgress";
import LbyrRecording from "@/components/lbyr/LbyrRecording";
import SlideLecture, { type LectureSlide } from "@/components/course/SlideLecture";
import { artFor } from "@/components/lbyr/LbyrSlideArt";
import LbyrFinishLesson from "@/components/lbyr/LbyrFinishLesson";
import LbyrCheckList from "@/components/lbyr/LbyrCheckList";

export const metadata: Metadata = {
  title: "Lead Before You’re Ready | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => ({
    slug: lbyrLessonSlug(i + 1),
  }));
}

export default async function LbyrLessonPage({ params }: Props) {
  await requireActiveMember();
  requireLbyrPublished();

  const { slug } = await params;
  const order = Number(slug);
  if (!Number.isInteger(order) || order < 1 || order > LBYR_LESSON_COUNT) notFound();

  const lesson = readLbyrLesson(order);
  const progress = await getCourseProgress(LBYR_SLUG);
  const finished = Boolean(progress.get(lesson.slug)?.completed_at);
  const completed = [...progress.values()].filter((p) => p.completed_at).length;

  // The deck plays only where the recording is actually in the bucket.
  const deck = LBYR_WIRED.has(order) ? readLbyrSlides(order) : null;
  const audioUrl = deck
    ? await signedMediaUrl("audio", `lbyr-lesson-${lesson.slug}.mp3`, LBYR_SLUG)
    : null;

  const isLast = order === LBYR_LESSON_COUNT;
  const nextHref = isLast ? lbyrFinishHref : lbyrLessonHref(order + 1);

  return (
    <LbyrShell
      notice={lesson.notice}
      eyebrow={
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] uppercase tracking-[0.16em] text-[#8B5E34]">
          <Link href={LBYR_BASE} className="underline underline-offset-4">
            Lead Before You’re Ready
          </Link>
          <span>
            Lesson {order} of {LBYR_LESSON_COUNT}
          </span>
        </div>
      }
    >
      {/* 1. Heading, with the progress bar counting completed lessons. */}
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Lesson {order} · {lesson.module}
        </p>
        <h1
          className="mt-2 text-[clamp(2rem,6vw,2.6rem)] leading-[1.15] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {lesson.title}
        </h1>
        <p className="mt-2 text-[19px] leading-snug text-[#6B5F53]">
          {lesson.question}
        </p>
        <LbyrProgress completed={completed} />
      </Panel>

      {/* 2. Key Scripture */}
      <Plain>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Key Scripture
        </p>
        <p
          className="mt-2 text-[19px] leading-relaxed text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Inlines nodes={lesson.scripture.text} />
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          {lesson.scripture.ref}
        </p>
      </Plain>

      {/* 3. In this lesson, you will: */}
      <Plain>
        <SectionHeading>In this lesson, you will:</SectionHeading>
        <Blocks blocks={lesson.objectives} />
      </Plain>

      {/* 4. Watch or listen — the recordings do not exist yet. */}
      <Panel>
        <SectionHeading>Watch or listen</SectionHeading>
        <div className="mt-4">
          {deck ? (
            <>
              <SlideLecture
                slides={deck.slides as LectureSlide[]}
                timings={deck.timings}
                audioUrl={audioUrl}
                lessonTitle={lesson.title}
                art={(key) => artFor(order, key)}
              />
              <p className="mt-3 text-[15px] leading-relaxed text-[#6B5F53]">
                {lesson.duration}
              </p>
              <details className="mt-4 border-t border-[#E5D9C7]">
                <summary className="flex cursor-pointer justify-between py-4 text-[13px] uppercase tracking-[0.14em] text-[#8B5E34]">
                  Read the transcript
                </summary>
                <div className="max-w-[65ch] pb-3">
                  <Blocks blocks={lesson.transcript} />
                </div>
              </details>
            </>
          ) : (
            <LbyrRecording duration={lesson.duration} transcript={lesson.transcript} />
          )}
        </div>
      </Panel>

      {/* 5. Think — nothing is typed and nothing is saved. */}
      <Plain>
        <SectionHeading>
          Think — <span className="text-[0.75em] text-[#6B5F53]">Let it settle</span>
        </SectionHeading>
        <ul className="mt-4 space-y-2 pl-6 text-[18px] leading-relaxed list-disc">
          {lesson.think.prompts.map((p, i) => (
            <li key={i}>
              <Blocks blocks={[p]} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6B5F53]">
          {lesson.think.note}
        </p>
      </Plain>

      {/* 6. Take one step — the week's action. */}
      <Panel>
        <SectionHeading>Take one step</SectionHeading>
        <div className="mt-3">
          <Blocks blocks={lesson.takeOneStep} />
        </div>
      </Panel>

      {/* 7. Go deeper — optional. */}
      <Plain>
        <SectionHeading>
          Go deeper <span className="text-[0.75em] text-[#6B5F53]">optional</span>
        </SectionHeading>
        <Blocks blocks={lesson.goDeeper.intro} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <span className="inline-flex min-h-11 items-center justify-center rounded-sm border border-dashed border-[#D9CDBA] px-5 py-3 text-[15px] text-[#6B5F53]">
            Open the worksheet — coming soon
          </span>
          <span className="inline-flex min-h-11 items-center justify-center rounded-sm border border-dashed border-[#D9CDBA] px-5 py-3 text-[15px] text-[#6B5F53]">
            Read Chapter {lesson.goDeeper.chapter} — coming soon
          </span>
        </div>
        <details className="mt-5 border-t border-[#E5D9C7]">
          <summary className="cursor-pointer py-4 text-[13px] uppercase tracking-[0.14em] text-[#8B5E34]">
            {lesson.goDeeper.worksheetSummary}
          </summary>
          <div className="max-w-[65ch] pb-3">
            <Blocks blocks={lesson.goDeeper.worksheet} />
          </div>
        </details>
      </Plain>

      {/* 8. Lesson 3 only: the check-in. Ticks are client-side and unsaved. */}
      {lesson.checkIn && (
        <Plain>
          <SectionHeading>Before you go on — a short check-in</SectionHeading>
          {lesson.checkIn.map((b, i) =>
            /* The six tick-boxes become real ones. Everything either side of
               them — the sentence above, the four outcome cards below — is
               ordinary content. */
            b.t === "list" && b.cls === "check" ? (
              <LbyrCheckList
                key={i}
                items={b.items.map((item) =>
                  item.flatMap((n) => (n.t === "p" ? n.c : []))
                )}
              />
            ) : (
              <Blocks key={i} blocks={[b]} />
            )
          )}
        </Plain>
      )}

      {/* 9. Need help with your next step? */}
      <Plain>
        <SectionHeading>Need help with your next step?</SectionHeading>
        <Blocks blocks={lesson.help} />
      </Plain>

      {/* 10. Ready to finish for today? */}
      <Panel>
        <SectionHeading>Ready to finish for today?</SectionHeading>
        <div className="mt-4">
          <LbyrFinishLesson
            lessonSlug={lesson.slug}
            lessonOrder={order}
            finished={finished}
            weekStep={lesson.finish.weekStep}
            nextLabel={lesson.finish.nextLabel}
            nextHref={nextHref}
            overviewHref={LBYR_BASE}
          />
        </div>
      </Panel>
    </LbyrShell>
  );
}
