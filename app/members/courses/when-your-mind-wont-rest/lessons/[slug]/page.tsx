import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findPageBySlug,
  findResource,
  getFoundationPages,
  readPageFile,
  resourceSlug,
  splitChapter,
} from "@/lib/mind-course";
import {
  getPageAnswers,
  getFinishedLessons,
  NEXT_STEP_INDEX,
  isNextStep,
  type NextStep,
} from "@/lib/mind-progress";
import { mindResourceHref, MIND_BASE } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";
import ChapterDisclosure from "@/components/mind/ChapterDisclosure";
import NextFaithfulStep from "@/components/mind/NextFaithfulStep";
import FinishLesson from "@/components/mind/FinishLesson";

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

  const { main, chapter } = splitChapter(file.body);

  // Lessons carry a step and a finish button; the Start Here pages are
  // orientation and count towards nothing, so they carry neither.
  const isLesson = module.counts_towards_completion;

  const [answers, finished] = await Promise.all([
    getPageAnswers(slug),
    isLesson ? getFinishedLessons() : Promise.resolve(new Map()),
  ]);

  const savedStep = answers.get(NEXT_STEP_INDEX) ?? "";
  const nextStep: NextStep | null = isNextStep(savedStep) ? savedStep : null;

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

      <article className="mt-2">
        <MindMarkdown source={main} />
      </article>

      {chapter && <ChapterDisclosure chapter={chapter} lessonTitle={page.title} />}

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
        <p className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-4 text-sm leading-relaxed text-[#4A4038]">
          {support}
        </p>
      )}
    </main>
  );
}
