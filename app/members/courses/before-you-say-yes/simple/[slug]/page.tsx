import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  HANDLED_HEADINGS, SIMPLE_PAGES, findSimplePage, lengthOf, normaliseHeading,
  pageSections, parseScreens, readSimplePage, sectionsOf, transcriptOf,
  workbookOf,
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

/**
 * Headings looked up by meaning rather than by exact text.
 *
 * The files spell them two ways — "Listen" on twelve pages and "Listen to the
 * lesson" on twenty, "Today's question" with a straight apostrophe on
 * twenty-three and a curly one on five. Matching the string exactly dropped
 * whichever spelling the template did not happen to name.
 */
const LISTEN = ["listen", "listen to the lesson"];
const TRANSCRIPT = ["audio script and transcript"];

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
  const get = (names: string[]) => {
    for (const [heading, section] of sections) {
      if (names.includes(normaliseHeading(heading))) return section.trim() || null;
    }
    return null;
  };

  const workbook = workbookOf(body);
  const screens = workbook ? parseScreens(workbook) : [];

  const src = await signedMediaUrl("audio", `${page.audio}.mp3`);
  // The length is read from the script's own note before that note is stripped.
  const transcript = transcriptOf(get(TRANSCRIPT));
  const length = lengthOf(get(LISTEN), get(TRANSCRIPT));

  const saved: Record<number, string[][]> = {};
  for (const screen of screens) {
    saved[screen.n] = (await getToolAnswer<string[][]>(slug, `W${screen.n}`)) ?? [];
  }

  const at = SIMPLE_PAGES.findIndex((p) => p.slug === slug);
  const next = SIMPLE_PAGES[at + 1] ?? null;
  const md = (source: string) => <MindMarkdown source={source} />;
  const renderedScreens: Record<number, React.ReactNode> = {};
  const renderedAfter: Record<number, React.ReactNode> = {};
  const renderedInstructions: Record<number, React.ReactNode> = {};
  for (const screen of screens) {
    renderedScreens[screen.n] = md(screen.body);
    if (screen.after) renderedAfter[screen.n] = md(screen.after);
    if (screen.instructions) renderedInstructions[screen.n] = md(screen.instructions);
  }

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

      {pageSections(body).map(({ heading, body: section }, i) => {
        const key = normaliseHeading(heading);

        // The Listen control stands where the page puts its Listen section,
        // with the transcript closed underneath it.
        if (key === "listen" || key === "listen to the lesson") {
          return (
            <SimpleAudio key={i} src={src} length={length} transcript={md(transcript)} />
          );
        }

        // "What would you like to do next?" becomes the real controls, in the
        // place the page puts it — which §3 has before "Need support?".
        if (key === "what would you like to do next?") {
          return (
            <nav key={i} className="mt-10 flex flex-wrap items-center gap-5">
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
              {screens.length > 0 && (
                <a
                  href="#go-deeper"
                  className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  Open the workbook
                </a>
              )}
              {page.chapter && (
                <Link
                  href={`${bysyPageHref(page.chapter.replace(/\.md$/, ""))}?from=${page.slug}`}
                  className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  Read the book chapter
                </Link>
              )}
            </nav>
          );
        }

        if (HANDLED_HEADINGS.has(key)) return null;

        // The preamble has no heading of its own: §3's safety notice, which
        // must be the first thing on the page.
        if (heading === "") {
          return (
            <section key={i} className="mt-8">
              {md(section)}
            </section>
          );
        }

        // The lesson's one sentence to carry away, set apart on every page. It
        // was a shaded box on Lesson 2 and plain text on Lesson 1 because the
        // styling followed the template's own list of headings rather than the
        // page's.
        if (key === "one truth to remember") {
          return (
            <section
              key={i}
              className="mt-10 rounded-sm border-l-2 border-[#8B5E34] bg-[#F7F1E6] px-5 py-4"
            >
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {heading}
              </h2>
              {md(section)}
            </section>
          );
        }

        const quiet = /^(today's question|key scripture|need support\?)$/.test(key);
        return (
          <section key={i} className={quiet ? "mt-8" : "mt-10"}>
            {quiet ? (
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {heading}
              </h2>
            ) : (
              <h2
                className="text-2xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {heading}
              </h2>
            )}
            {md(section)}
          </section>
        );
      })}

      {screens.length > 0 && (
        <div id="go-deeper">
        <Workbook
          pageSlug={slug}
          screens={screens}
          saved={saved}
          rendered={renderedScreens}
          renderedAfter={renderedAfter}
          renderedInstructions={renderedInstructions}
        />
        </div>
      )}

      <p className="mt-8">
        <Link
          href={bysySupportHref()}
          className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Finding Help Where You Live
        </Link>
      </p>

    </main>
  );
}
