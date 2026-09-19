import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  SIMPLE_PAGES, findSimplePage, lengthOf, parseScreens, readSimplePage,
  sectionsOf, transcriptOf,
} from "@/lib/bysy-simple";
import { simpleHref } from "@/lib/bysy-simple-links";
import { BYSY_BASE, bysyPageHref, bysySupportHref } from "@/lib/bysy-links";
import { getToolAnswer } from "@/lib/bysy-progress";
import { signedMediaUrl } from "@/lib/course-media";
import MindMarkdown from "@/components/mind/MindMarkdown";
import SimpleAudio from "@/components/bysy/SimpleAudio";
import Workbook from "@/components/bysy/Workbook";

export const metadata: Metadata = {
  title: "Before You Say Yes | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SIMPLE_PAGES.map((p) => ({ slug: p.slug }));
}

/** The section headings the addendum's §3 template names, in its order. */
const S = {
  question: "Today's question",
  listen: "Listen to the lesson",
  truth: "One truth to remember",
  scripture: "Key Scripture",
  transcript: "Audio script and transcript",
  pause: "Pause and think",
  step: "One step for today",
  next: "What would you like to do next?",
  support: "Need support?",
};

/**
 * One page of the simple layer.
 *
 * Built from the page's own markdown rather than a template filled in by hand:
 * the section headings are the addendum's, and anything the page does not have
 * simply does not render. A page with no workbook shows no workbook; a page
 * with no audio says so.
 *
 * The order is §3's and not the file's. The transcript sits in the middle of
 * the markdown, between Key Scripture and Pause and think, because that is
 * where it reads naturally in a document — but on the page it belongs with the
 * recording it transcribes, closed, directly under the Listen control.
 */
export default async function SimpleLessonPage({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const page = findSimplePage(slug);
  if (!page) notFound();

  const body = readSimplePage(page.file);
  if (!body) notFound();

  const sections = sectionsOf(body);
  const get = (name: string) => sections.get(name)?.trim() || null;

  const workbookHeading = [...sections.keys()].find((k) => k.startsWith("Go deeper"));
  const screens = workbookHeading ? parseScreens(sections.get(workbookHeading) ?? "") : [];

  const src = await signedMediaUrl("audio", `${page.audio}.mp3`);
  // The length is read from the script's own note before that note is stripped.
  const transcript = transcriptOf(get(S.transcript));
  const length = lengthOf(get(S.listen), get(S.transcript));

  const saved: Record<number, string[][]> = {};
  for (const screen of screens) {
    saved[screen.n] = (await getToolAnswer<string[][]>(slug, `W${screen.n}`)) ?? [];
  }

  const at = SIMPLE_PAGES.findIndex((p) => p.slug === slug);
  const next = SIMPLE_PAGES[at + 1] ?? null;
  const md = (source: string) => <MindMarkdown source={source} />;
  const renderedScreens: Record<number, React.ReactNode> = {};
  for (const screen of screens) renderedScreens[screen.n] = md(screen.body);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-10 sm:pt-14">
      <Link href={BYSY_BASE} className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        ← Before You Say Yes
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {page.module} · Page {page.n} of {SIMPLE_PAGES.length}
      </p>

      <h1
        className="mt-2 text-3xl text-[#2B2118] sm:text-4xl"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {page.title}
      </h1>

      {get(S.question) && (
        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            Today&rsquo;s question
          </h2>
          {md(get(S.question)!)}
        </section>
      )}

      <SimpleAudio
        src={src}
        length={length}
        transcript={md(transcript)}
      />

      {get(S.truth) && (
        <section className="mt-10 rounded-sm border-l-2 border-[#8B5E34] bg-[#F7F1E6] px-5 py-4">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            One truth to remember
          </h2>
          {md(get(S.truth)!)}
        </section>
      )}

      {get(S.scripture) && (
        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            Key Scripture
          </h2>
          {md(get(S.scripture)!)}
        </section>
      )}

      {get(S.pause) && (
        <section className="mt-10">
          <h2
            className="text-2xl text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            Pause and think
          </h2>
          {md(get(S.pause)!)}
        </section>
      )}

      {get(S.step) && (
        <section className="mt-10">
          <h2
            className="text-2xl text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            One step for today
          </h2>
          {md(get(S.step)!)}
        </section>
      )}

      {screens.length > 0 && (
        <Workbook
          pageSlug={slug}
          screens={screens}
          saved={saved}
          rendered={renderedScreens}
        />
      )}

      {get(S.support) && (
        <section className="mt-12 border-t border-[#E5D9C7] pt-8">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            Need support?
          </h2>
          {md(get(S.support)!)}
          <p className="mt-3">
            <Link
              href={bysySupportHref()}
              className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              Finding Help Where You Live
            </Link>
          </p>
        </section>
      )}

      <nav className="mt-12 flex flex-wrap items-center gap-5 border-t border-[#E5D9C7] pt-8">
        {next && (
          <Link
            href={simpleHref(next.slug)}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Continue to {next.title}
          </Link>
        )}
        <Link
          href={BYSY_BASE}
          className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Stop here for today
        </Link>
        {page.chapter && (
          <Link
            href={bysyPageHref(page.chapter.replace(/\.md$/, ""))}
            className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Read the book chapter
          </Link>
        )}
      </nav>
    </main>
  );
}
