import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  HANDLED_HEADINGS, SIMPLE_PAGES, findSimplePage, lengthOf, markersIn,
  normaliseHeading, pageSections, parseScreens, readSimplePage, resolveMarker,
  EXIT_HREF, isSafetyRouteSection, linkExit, linkSupport, parseChoiceOptions,
  rulesFor, sectionsOf,
  transcriptOf, withoutBuilderText, withoutChoiceOptions,
  withoutChoicePlaceholder, withoutMarkers, workbookNote, workbookOf,
} from "@/lib/bysy-simple";
import { simpleHref } from "@/lib/bysy-simple-links";
import { getCourseComplete } from "../../actions";
import { BYSY_BASE, BYSY_SLUG, bysyPageHref, bysySupportHref } from "@/lib/bysy-links";
import { getToolAnswer } from "@/lib/bysy-progress";
import { signedMediaUrl } from "@/lib/course-media";
import MindMarkdown from "@/components/mind/MindMarkdown";
import SimpleAudio from "@/components/bysy/SimpleAudio";
import Workbook from "@/components/bysy/Workbook";
import PauseAnswer from "@/components/bysy/PauseAnswer";
import Acknowledge from "@/components/bysy/Acknowledge";
import CompletionRecord from "@/components/bysy/CompletionRecord";
import RouteCard from "@/components/bysy/RouteCard";
import PageChoice from "@/components/bysy/PageChoice";
import ExitLink from "@/components/bysy/ExitLink";

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
  const openingNote = workbook ? withoutBuilderText(workbookNote(workbook)) : "";

  const src = await signedMediaUrl("audio", `${page.audio}.mp3`, BYSY_SLUG);
  // The length is read from the script's own note before that note is stripped.
  const transcript = transcriptOf(get(TRANSCRIPT));
  const length = lengthOf(page, get(LISTEN), get(TRANSCRIPT));

  // §6.3, plus each page's own note. A non-saved screen is never read back
  // either: nothing about it is stored, so there is nothing to return.
  const rules = rulesFor(slug, screens);
  const saved: Record<number, string[][]> = {};
  for (const screen of screens) {
    saved[screen.n] = rules.nonSaved.includes(screen.n)
      ? []
      : (await getToolAnswer<string[][]>(slug, `W${screen.n}`)) ?? [];
  }

  const at = SIMPLE_PAGES.findIndex((p) => p.slug === slug);
  const next = SIMPLE_PAGES[at + 1] ?? null;

  // The bracketed labels in the source become real controls. Resolving them
  // here keeps the destinations on the server, where the page list lives.
  const linkBase = {
    home: BYSY_BASE,
    simple: simpleHref,
    detailed: (s: string) => bysyPageHref(s),
  };
  const pauseAnswer = ((await getToolAnswer<string[][]>(slug, "P")) ?? [])[0]?.[0] ?? "";

  // §2's completion record, on the last page of the layer. "What Comes Next?"
  // says a completion record means only that the material was completed, and
  // the label may never claim readiness — the control enforces that wording.
  // The check-ins and the closing page offer a choice. The ordinary one saves;
  // the separate safety route never does, so it is read from the page and
  // handed over without any storage behind it.
  const allSections = pageSections(body);
  const safetySection = allSections.find((s) => isSafetyRouteSection(s.heading));
  const safetyOption = safetySection ? parseChoiceOptions(safetySection.body)[0] ?? null : null;
  const savedChoice = ((await getToolAnswer<string[][]>(slug, "C")) ?? [])[0]?.[0] ?? "";

  const isFinalPage = page.n === SIMPLE_PAGES.length;
  const courseComplete = isFinalPage ? await getCourseComplete() : false;
  // Every reference to the support page becomes a link before it is rendered.
  const md = (source: string) => (
    <MindMarkdown
      source={linkExit(linkSupport(source, bysySupportHref()))}
      extra={{
        a: ({ href, children }) =>
          href === EXIT_HREF ? (
            <ExitLink>{children}</ExitLink>
          ) : (
            <a
              href={href}
              className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              {children}
            </a>
          ),
      }}
    />
  );
  // The client gets what it needs to draw controls and nothing else. Passing
  // the screens whole shipped their raw markdown into the page source — the
  // builder instructions included, stripped from the prose but still there for
  // anyone reading the payload.
  const clientScreens = screens.map(
    ({ n, title, group, prompts, options, kind, ticks, categories, repeats, example }) => ({
      n,
      title,
      group,
      prompts,
      options,
      kind,
      ticks,
      categories,
      repeats,
      example,
      body: "",
      after: "",
      instructions: "",
    })
  );

  // A safety check written across two screens states its instruction once,
  // under the second — "If any answer on Screen 11 or 12 is Yes, do not
  // arrange a family meeting…". A Yes on the first must show it too, so a pair
  // shares the text of whichever of them carries it.
  const routeText: Record<number, string> = {};
  for (const screen of screens) {
    if (!rules.safety.includes(screen.n)) continue;
    if (screen.after) {
      routeText[screen.n] = screen.after;
      continue;
    }
    const later = screens.find((s) => s.n > screen.n && rules.safety.includes(s.n) && s.after);
    if (later?.after) routeText[screen.n] = later.after;
  }

  const renderedScreens: Record<number, React.ReactNode> = {};
  const renderedAfter: Record<number, React.ReactNode> = {};
  const renderedInstructions: Record<number, React.ReactNode> = {};
  for (const screen of screens) {
    renderedScreens[screen.n] = md(withoutBuilderText(screen.body));
    const after = routeText[screen.n] ?? screen.after;
    if (after) renderedAfter[screen.n] = md(withoutBuilderText(after));
    if (screen.instructions) {
      const shown = withoutBuilderText(screen.instructions);
      if (shown) renderedInstructions[screen.n] = md(shown);
    }
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
            <nav key={i} className="mt-10">
              {/* Three ways on from the lesson, then the book chapter apart
                  from them. It is not a next step: it is the same material at
                  length, for a reader who wants it now or later. Sitting in
                  the row it read as a fourth choice of equal weight, and under
                  the Continue button on a phone it read as the one after it. */}
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                {next && (
                  <Link
                    href={simpleHref(next.slug)}
                    className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
                  >
                    Next: {next.title}
                  </Link>
                )}
                <Link
                  href={BYSY_BASE}
                  className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-5 py-3 text-center text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] sm:border-0 sm:px-0 sm:py-0 sm:text-[#5C5147] sm:underline sm:underline-offset-4 sm:hover:text-[#2B2118]"
                >
                  Stop here for today
                </Link>
                {screens.length > 0 && (
                  <a
                    href="#go-deeper"
                    className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-5 py-3 text-center text-sm text-[#8B5E34] transition-colors hover:border-[#8B5E34] sm:border-0 sm:px-0 sm:py-0 sm:underline sm:underline-offset-4 sm:hover:text-[#2B2118]"
                  >
                    Open the workbook
                  </a>
                )}
              </div>

              {page.chapter && (
                <div className="mt-6 flex flex-col items-stretch sm:mt-5 sm:block">
                  <Link
                    href={`${bysyPageHref(page.chapter.replace(/\.md$/, ""))}?from=${page.slug}`}
                    className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-5 py-3 text-center text-sm text-[#8B5E34] transition-colors hover:border-[#8B5E34] sm:border-0 sm:px-0 sm:py-0 sm:underline sm:underline-offset-4 sm:hover:text-[#2B2118]"
                  >
                    Read the book chapter
                  </Link>
                </div>
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
              {md(withoutBuilderText(withoutMarkers(section)))}
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
              {md(withoutBuilderText(withoutMarkers(section)))}
            </section>
          );
        }

        const quiet = /^(today's question|key scripture|need support\?)$/.test(key);
        // A section whose body carries "### ☐" options becomes the control.
        const choiceOptions = parseChoiceOptions(section);
        const isSafetyRoute = isSafetyRouteSection(heading);
        const prose = withoutChoicePlaceholder(
          choiceOptions.length > 0 ? withoutChoiceOptions(section) : section
        );

        const controls = markersIn(section)
          .map((label) => resolveMarker(label, page, linkBase))
          .filter((m) => m.kind !== "drop");

        return (
          <section
            key={i}
            // "Need support?" follows the next-step controls on every page §3
            // orders that way, and at mt-8 it read as the last line of them
            // rather than as the section a reader goes looking for.
            className={key === "need support?" ? "mt-16" : quiet ? "mt-8" : "mt-10"}
          >
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
            {md(withoutBuilderText(withoutMarkers(prose)))}

            {choiceOptions.length > 0 && !isSafetyRoute && (
              <PageChoice
                pageSlug={slug}
                options={choiceOptions}
                safetyOption={safetyOption}
                saved={savedChoice}
              />
            )}

            {controls.map((control, c) => {
              if (control.kind === "write") {
                return (
                  <PauseAnswer
                    key={c}
                    pageSlug={slug}
                    label={control.label}
                    hint={control.hint}
                    saved={pauseAnswer}
                  />
                );
              }
              if (control.kind === "route") {
                return (
                  <div key={c} className="mt-3">
                    <RouteCard
                      routeId={control.routeId}
                      href={control.href}
                      label={control.label}
                    />
                  </div>
                );
              }
              if (control.kind === "acknowledge") {
                return (
                  <Acknowledge
                    key={c}
                    pageSlug={slug}
                    label={control.label}
                    href={control.href}
                  />
                );
              }
              return (
                <p key={c} className="mt-4">
                  <Link
                    href={control.href}
                    className={
                      control.strong
                        ? "inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
                        : "text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                    }
                  >
                    {control.label}
                  </Link>
                </p>
              );
            })}
          </section>
        );
      })}

      {isFinalPage && <CompletionRecord complete={courseComplete} />}

      {screens.length > 0 && (
        <Workbook
          pageSlug={slug}
          screens={clientScreens}
          saved={saved}
          nonSaved={rules.nonSaved}
          readOnly={rules.readOnly}
          guides={rules.guides}
          safety={rules.safety}
          openingNote={openingNote ? md(openingNote) : null}
          rendered={renderedScreens}
          renderedAfter={renderedAfter}
          renderedInstructions={renderedInstructions}
        />
      )}

    </main>
  );
}
