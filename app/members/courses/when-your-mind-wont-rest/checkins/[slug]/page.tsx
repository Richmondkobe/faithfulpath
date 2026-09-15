import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  checkinSlug as slugOf,
  findCheckin,
  getCheckins,
  getCountingLessons,
  readPageFile,
  splitPauseQuestions,
} from "@/lib/mind-course";
import {
  getPageAnswers,
  readJson,
  CHECKIN_INDEX,
  PATTERN_FINDER_INDEX,
} from "@/lib/mind-progress";
import { MIND_BASE } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";
import ModulePause from "@/components/mind/ModulePause";
import PatternFinder, { type Pattern } from "@/components/mind/PatternFinder";
import EraseEntries from "@/components/mind/EraseEntries";

export const metadata: Metadata = {
  title: "Pause | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCheckins().map((c) => ({ slug: slugOf(c) }));
}

/**
 * The four module pauses and the Pattern Finder.
 *
 * None of these is scored, required, or a gate on anything. They do not affect
 * the certificate and they do not affect completion — the manifest says so on
 * every one of them, and this route has no code that could make them matter.
 */
export default async function MindCheckin({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const checkin = findCheckin(slug);
  if (!checkin) notFound();

  const file = readPageFile(checkin.file);
  if (!file) notFound();

  const answers = await getPageAnswers(slug);

  const lessons = getCountingLessons().filter((l) => typeof l.order === "number");
  const lessonSlugByNumber = Object.fromEntries(
    lessons.map((l) => [
      l.order as number,
      l.slug ?? l.file.split("/").pop()!.replace(/\.md$/, ""),
    ])
  ) as Record<number, string>;
  const lessonTitleByNumber = Object.fromEntries(
    lessons.map((l) => [l.order as number, l.title])
  ) as Record<number, string>;

  const isPatternFinder = checkin.type === "pattern_finder";
  const { before, questions, after } = isPatternFinder
    ? { before: file.body, questions: [], after: "" }
    : splitPauseQuestions(file.body);

  const patterns = (checkin.patterns ?? (file.front.patterns as Pattern[] | undefined) ?? [])
    .map((p) => ({ id: p.id, text: p.text, lesson: p.lesson ?? null }));

  const resultText =
    (checkin.rules?.result_text as string | undefined) ??
    (typeof file.front.result_text === "string" ? file.front.result_text : null) ??
    "These lessons may be helpful.";

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
      <Link
        href={MIND_BASE}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← When Your Mind Won&rsquo;t Rest
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {isPatternFinder ? "Pattern Finder" : "Module pause"} · optional
      </p>

      <article className="mt-2">
        <MindMarkdown source={before} />
      </article>

      {isPatternFinder ? (
        <PatternFinder
          checkinSlug={slug}
          patterns={patterns}
          resultText={resultText}
          lessonSlugByNumber={lessonSlugByNumber}
          lessonTitleByNumber={lessonTitleByNumber}
          saved={
            readJson<{ selected: string[] }>(answers, PATTERN_FINDER_INDEX)?.selected ?? []
          }
        />
      ) : (
        questions.length > 0 && (
          <ModulePause
            checkinSlug={slug}
            questions={questions}
            saved={readJson<Record<string, string>>(answers, CHECKIN_INDEX) ?? {}}
          />
        )
      )}

      {answers.size > 0 && <EraseEntries pageSlug={slug} />}

      {after && (
        <div className="mt-10 border-t border-[#E5D9C7] pt-8">
          <MindMarkdown source={after} />
        </div>
      )}
    </main>
  );
}
