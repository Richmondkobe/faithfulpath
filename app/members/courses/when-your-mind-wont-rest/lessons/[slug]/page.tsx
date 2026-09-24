import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findPageBySlug,
  findResource,
  linkCourseReferences,
  getCountingLessons,
  getFoundationPages,
  readPageFile,
  resourceSlug,
  splitChapter,
} from "@/lib/mind-course";
import {
  getPageAnswers,
  getFinishedLessons,
  readJson,
  ACKNOWLEDGEMENT_INDEX,
  INTENTION_INDEX,
  NEXT_STEP_INDEX,
  PATH_INDEX,
  isNextStep,
  type NextStep,
} from "@/lib/mind-progress";
import { signedMediaUrl } from "@/lib/course-media";
import { mindResourceHref, MIND_BASE, MIND_COURSE_SLUG } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";
import NextFaithfulStep from "@/components/mind/NextFaithfulStep";
import FinishLesson from "@/components/mind/FinishLesson";
import PathChoice from "@/components/mind/PathChoice";
import Intentions from "@/components/mind/Intentions";
import Acknowledgement, { type AckState } from "@/components/mind/Acknowledgement";
import RestlessList, { type RestlessEntry } from "@/components/mind/RestlessList";
import EraseEntries from "@/components/mind/EraseEntries";
import PrayerAudio from "@/components/mind/PrayerAudio";
import SlidePlayer from "@/components/mind/SlidePlayer";
import { practiceFrom, readNarration, readSlides, slideAudioId } from "@/lib/mind-slides";
import { slideFontVars } from "@/lib/slide-fonts";

export const metadata: Metadata = {
  title: "When Your Mind Won't Rest | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

/**
 * Every foundation page: the nine Start Here pages and the twenty-one lessons.
 *
 * There are no prerequisite locks anywhere in this course, which the manifest
 * states outright. Any page may be opened at any time; the member's chosen path
 * suggests an order and never enforces one, and a page written for someone in
 * difficulty is never behind a page they have not read.
 */
export function generateStaticParams() {
  return getFoundationPages().map(({ page }) => ({
    slug: page.slug ?? page.file.split("/").pop()!.replace(/\.md$/, ""),
  }));
}

export default async function MindLesson({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const found = findPageBySlug(slug);
  if (!found) notFound();

  const { page, module } = found;
  const file = readPageFile(page.file);
  if (!file) notFound();

  // The chapter is still lifted out of the body so it does not render inline;
  // it is no longer offered as a disclosure of its own.
  const { main } = splitChapter(file.body);

  // Lessons carry a step and a finish button; the Start Here pages are
  // orientation and count towards nothing, so they carry neither.
  const isLesson = module.counts_towards_completion;

  const [answers, finished] = await Promise.all([
    getPageAnswers(slug),
    isLesson ? getFinishedLessons() : Promise.resolve(new Map()),
  ]);

  const savedStep = answers.get(NEXT_STEP_INDEX) ?? "";
  const nextStep: NextStep | null = isNextStep(savedStep) ? savedStep : null;

  const choice = file.front.choice as
    | { options?: { id: string; label: string }[] }
    | undefined;
  const intention = file.front.intention as
    | { questions?: { id: string; prompt: string }[] }
    | undefined;
  const acknowledgement = file.front.acknowledgement as
    | { intro?: string; statements?: { id: string; text: string }[] }
    | undefined;

  // The restless-now list is generated from `entries`; the Markdown list in the
  // body is the fallback the build checks it against.
  const entries = (file.front.render_list_from_entries
    ? ((file.front.entries as RestlessEntry[] | undefined) ?? [])
    : []) as RestlessEntry[];

  const lessonSlugByNumber = Object.fromEntries(
    getCountingLessons()
      .filter((l) => typeof l.order === "number")
      .map((l) => [l.order as number, l.slug ?? l.file.split("/").pop()!.replace(/\.md$/, "")])
  ) as Record<number, string>;

  // The recording this page carries, if any. A missing object signs as null,
  // which is what keeps the "not available yet" note showing for phase two.
  const audioId = typeof file.front.audio === "string" ? file.front.audio : null;
  const audioSrc = audioId ? await signedMediaUrl("audio", `${audioId}.mp3`) : null;

  // The slide lecture, where the lesson has one. Its recording lives in the
  // course's own folder in the bucket, apart from the guided prayers that have
  // always sat directly under audio/.
  const order = typeof page.order === "number" ? page.order : null;
  const slides = order ? readSlides(order) : null;
  const slideAudio = slides && order
    ? await signedMediaUrl("audio", `${slideAudioId(order)}.mp3`, MIND_COURSE_SLUG)
    : null;
  const narration = slides && order ? readNarration(order) : [];
  const practice = slides ? practiceFrom(slides) : null;

  // How long the recording runs, taken from the slides rather than written
  // down: the last slide's start plus the time it holds the screen is close
  // enough for "about N minutes", and it cannot drift from the deck.
  const runtimeMinutes = slides ? (slides[slides.length - 1].t + 40) / 60 : 0;

  const action = typeof file.front.action === "string" ? file.front.action : null;
  const support = typeof file.front.support === "string" ? file.front.support : null;

  // A lesson with no worksheet — Lesson 21 — renders no worksheet section at
  // all rather than an empty one. Worksheets resolve by filename against the
  // manifest registry, never relative to this lesson's own directory.
  const worksheets = (page.resources ?? [])
    .map((ref) => findResource(ref))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
      <Link
        href={MIND_BASE}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← When Your Mind Won&rsquo;t Rest
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {module.title}
        {page.key_scripture && <> · {page.key_scripture}</>}
      </p>

      {/* A lesson that has a slide lecture is watched or listened to; one that
          does not is read, exactly as before. The lessons are converted a deck
          at a time, so both have to work at once, and which a lesson gets is
          decided by whether its slides.json exists. */}
      {slides ? (
        <>
          <h1
            className="mt-2 text-[2rem] leading-[1.15] text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {page.title}
          </h1>

          <section className="mt-8">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              Watch or listen
            </h2>
            <div className={`mt-3 ${slideFontVars}`}>
              <SlidePlayer
                slides={slides}
                audioUrl={slideAudio}
                lessonTitle={page.title}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">
              About {Math.round(runtimeMinutes)} minutes, plus one short pause.
            </p>

            {/* Lesson 16's prayer is a recording of its own, and the lesson is
                about praying it rather than about listening to a talk. */}
            {audioId && (
              <div className="mt-5">
                <PrayerAudio src={audioSrc} title={page.title} />
              </div>
            )}
          </section>

          {practice && (
            <section className="mt-12">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                Take one step
              </h2>
              <p
                className="mt-3 text-xl leading-snug text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                {practice.heading}
              </p>
              {practice.lines.map((line) => (
                <p key={line} className="mt-3 leading-relaxed text-[#4A4038]">
                  {line}
                </p>
              ))}
            </section>
          )}
        </>
      ) : (
        <>
          <article className="mt-2">
            <MindMarkdown source={main} />
          </article>

          {audioId && <PrayerAudio src={audioSrc} title={page.title} />}
        </>
      )}

      {/* Read as "Go deeper" once there is a lecture above it: the worksheet
          is the way further in, rather than the body of the page.
          The complete chapter used to sit here as well. It is still in each
          lesson's file, and splitChapter still lifts it out of the body so it
          does not reappear inline — it is simply no longer offered. */}
      {slides && worksheets.length > 0 && (
        <h2 className="mt-12 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Go deeper
        </h2>
      )}

      {/* The Start Here pages that do something beyond reading. Each is driven
          by its own front-matter block, so the page's author decides what it
          asks and this route only renders it. */}
      {choice && (
        <PathChoice
          options={choice.options ?? []}
          saved={answers.get(PATH_INDEX)?.trim() || null}
        />
      )}

      {intention && (
        <Intentions
          questions={intention.questions ?? []}
          saved={readJson<Record<string, string>>(answers, INTENTION_INDEX) ?? {}}
        />
      )}

      {acknowledgement && (
        <Acknowledgement
          intro={acknowledgement.intro ?? ""}
          statements={acknowledgement.statements ?? []}
          saved={readJson<AckState>(answers, ACKNOWLEDGEMENT_INDEX) ?? {}}
        />
      )}

      {entries.length > 0 && (
        <RestlessList entries={entries} lessonSlugByNumber={lessonSlugByNumber} />
      )}

      {/* Only where there is something of theirs to delete. */}
      {(intention || answers.size > 0) && <EraseEntries pageSlug={slug} />}

      {worksheets.length > 0 && (
        <section className="mt-12 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            {worksheets.length === 1 ? "Worksheet" : "Worksheets"}
          </h2>
          <ul className="mt-4 space-y-3">
            {worksheets.map((resource) => (
              <li key={resource.file}>
                <Link
                  href={mindResourceHref(resourceSlug(resource))}
                  className="text-[#2B2118] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
                >
                  {resource.toolkit_number}. {resource.title}
                </Link>
                {resource.not_for_group_sharing && (
                  <span className="mt-1 block text-sm text-[#6B5F53]">
                    Private — not for group sharing.
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
            Optional, and yours alone. Nothing here counts towards finishing the
            course.
          </p>
        </section>
      )}

      {/* Every word of the recording, closed. A member who would rather read
          than listen, or cannot listen, loses nothing by never starting it —
          which is also what makes the player safe to require JavaScript for. */}
      {narration.length > 0 && (
        <details className="group mt-12 rounded-sm border border-[#E5D9C7]">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm text-[#2B2118] transition-colors hover:bg-[#F7F1E6]">
            <span className="font-medium">Read the transcript</span>
            <span className="ml-2 text-[#6B5F53]">
              — every word of the recording, in writing
            </span>
          </summary>
          <div className="border-t border-[#E5D9C7] px-5 pb-5">
            {narration.map((paragraph, i) => (
              <p key={i} className="mt-4 leading-relaxed text-[#4A4038]">
                {paragraph}
              </p>
            ))}
          </div>
        </details>
      )}

      {isLesson && action && (
        <NextFaithfulStep lessonSlug={slug} action={action} saved={nextStep} />
      )}

      {isLesson && (
        <FinishLesson
          lessonSlug={slug}
          label={page.finish_label ?? "I have finished this lesson for today"}
          finished={Boolean(finished.get(slug)?.finished)}
        />
      )}

      {support && (
        <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-4 text-sm leading-relaxed text-[#4A4038]">
          {/* The support note comes from front matter rather than the body, so
              it misses the linking that readPageFile does — and two lessons
              name Finding Help Where You Live inside it. */}
          <MindMarkdown source={linkCourseReferences(support, page.file)} tight />
        </div>
      )}
    </main>
  );
}
