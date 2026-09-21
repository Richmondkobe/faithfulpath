import Link from "next/link";
import { notFound } from "next/navigation";

import MindMarkdown from "@/components/mind/MindMarkdown";
import ResetAudio from "@/components/reset/ResetAudio";
import ResetStep from "@/components/reset/ResetStep";
import ResetRouteCards from "@/components/reset/ResetRouteCards";
import ResetContinue from "@/components/reset/ResetContinue";
import ResetReflection from "@/components/reset/ResetReflection";
import ResetCheckin from "@/components/reset/ResetCheckin";
import ResetLocalChecks from "@/components/reset/ResetLocalChecks";
import ResetPlanCards from "@/components/reset/ResetPlanCards";
import { requireActiveMember } from "@/lib/member-gate";
import { signedMediaUrl } from "@/lib/course-media";
import { getCourseProgress } from "@/lib/course-progress";
import {
  getResetPlan,
  getResetRoute,
} from "@/app/members/courses/christian-spiritual-reset/actions";
import { getLessonReflections } from "@/lib/course-progress";
import { lessonHref } from "@/lib/course";
import {
  RESET_SIMPLE_PAGES,
  bodyOf,
  linkLandmarks,
  afterSafety,
  cardsIn,
  planCards,
  checkinGuidance,
  checkinQuestions,
  routeCards,
  withoutMarkers,
  withoutSubtitle,
  withoutRouteCards,
  findResetSimplePage,
  placeInPart,
  readResetSimplePage,
  resetSections,
  blocksOf,
  transcriptOf,
} from "@/lib/reset-simple";
import { RESET_BASE, RESET_SLUG, resetSimpleHref } from "@/lib/reset-simple-links";

/**
 * A page of the Reset's simple layer.
 *
 * Built behind RESET_SIMPLE_PUBLISHED, which is false: nothing links here, the
 * course card and course home still count and open the 38-page course, and a
 * member sees no change. The route answers so the pages can be looked at while
 * they are built — the same way Before You Say Yes's layer was.
 *
 * One template so far, the teaching page, which Start Here 1 is built on. The
 * check-in, session, retreat-plan and finish pages each need their own and are
 * not wired yet; a page whose template is missing says so rather than
 * pretending to be one.
 */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RESET_SIMPLE_PAGES.map((p) => ({ slug: p.slug }));
}

/** The templates that exist. Everything else is still to be built. */
const BUILT = new Set([
  "welcome",
  "how-to-use",
  "choose-starting-point",
  "safety-and-support",
  "lesson-01",
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "checkin-01",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
  "lesson-09",
  "checkin-02",
]);

export default async function ResetSimplePage({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const page = findResetSimplePage(slug);
  if (!page) notFound();

  const markdown = readResetSimplePage(page.file);
  if (!markdown) notFound();

  const src = page.audio
    ? await signedMediaUrl("audio", `${page.audio}.mp3`, RESET_SLUG)
    : null;

  const place = placeInPart(page);
  const at = RESET_SIMPLE_PAGES.findIndex((p) => p.slug === page.slug);
  const next = RESET_SIMPLE_PAGES[at + 1];

  const chosenRoute =
    page.slug === "choose-starting-point" || page.slug === "safety-and-support"
      ? await getResetRoute()
      : null;
  // Lesson 5 is where a retreat is chosen, and its completion waits on one.
  const chosenPlan = page.slug === "lesson-05" ? await getResetPlan() : null;
  const answers = await getLessonReflections(RESET_SLUG, page.slug);
  const progress = await getCourseProgress(RESET_SLUG);
  const done = Boolean(progress.get(page.slug)?.completed_at);

  // Each page names its own Go Deeper destination; Safety and Support is the
  // same page for everyone, and is not linked from itself.
  const help = lessonHref(RESET_SLUG, "00-finding-help-where-you-live");
  const to = {
    deeper: page.deeper[0] ? lessonHref(RESET_SLUG, page.deeper[0]) : null,
    safety: page.slug === "safety-and-support" ? null : resetSimpleHref("safety-and-support"),
    help,
  };

  const sections = resetSections(bodyOf(markdown));

  // Check-in 1 is a single control spread over three of its own sections: the
  // questions, the guidance it chooses between, and the cards it offers
  // afterwards. They are gathered here and rendered as one, so the page cannot
  // show guidance or cards on their own.
  const questions = checkinQuestions(
    sections.find((x) => /three short questions/i.test(x.heading))?.body ?? ""
  );
  const guidanceBlocks = checkinGuidance(
    sections.find((x) => /^your guidance$/i.test(x.heading))?.body ?? ""
  );
  const pathCards = cardsIn(
    sections.find((x) => /choose your next step/i.test(x.heading))?.body ?? ""
  );
  const transcript = transcriptOf(markdown);

  // "What you will do here:" opens the page above the first heading.
  const opening = sections.find((s) => !s.heading)?.body ?? "";

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 text-[#2B2118] sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {page.part} · {place.n} of {place.of}
      </p>
      <h1
        className="mt-2 text-3xl text-[#2B2118] sm:text-4xl"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {page.title}
      </h1>

      {!BUILT.has(page.slug) && (
        <p className="mt-6 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
          This page&rsquo;s template is not built yet. Its words are in the
          repository and its recording is made; what is missing is the shape
          this kind of page takes.
        </p>
      )}

      {opening && (
        <div className="mt-6 text-[#4A4038]">
          <MindMarkdown source={linkLandmarks(withoutSubtitle(withoutMarkers(opening)), to)} tight />
        </div>
      )}

      {sections.map(({ heading, body }, i) => {
        if (!heading) return null;

        // The Listen section becomes the real control, with the transcript
        // closed underneath it, where the page puts it.
        if (/^listen$/i.test(heading)) {
          return (
            <ResetAudio
              key={i}
              src={src}
              length={page.length}
              transcript={<MindMarkdown source={transcript} tight />}
            />
          );
        }

        // The one sentence to carry away, set apart as it is on every page.
        if (/^one truth to remember$/i.test(heading)) {
          return (
            <section
              key={i}
              className="mt-10 rounded-sm border-l-2 border-[#8B5E34] bg-[#F7F1E6] px-5 py-4"
            >
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {heading}
              </h2>
              <MindMarkdown source={body} tight />
            </section>
          );
        }

        if (questions.length > 0) {
          if (/^your guidance$/i.test(heading) || /choose your next step/i.test(heading)) {
            return null;
          }
          if (/three short questions/i.test(heading)) {
            return (
              <section key={i} className="mt-10">
                <h2
                  className="text-2xl text-[#2B2118]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {heading}
                </h2>
                <ResetCheckin
                  pageSlug={page.slug}
                  questions={questions}
                  guidance={Object.fromEntries(
                    guidanceBlocks.map((g) => [
                      g.letter,
                      <MindMarkdown
                        key={g.letter}
                        // Guidance A names the support page twice — "Get Help
                        // Now" and "Find support where I live". The second is
                        // the brown button the control renders beneath the
                        // guidance, so it is dropped here rather than printed
                        // above its own button.
                        source={withoutMarkers(
                          linkLandmarks(
                            `**${g.title}**\n\n${g.body}`.replace(
                              /^\s*\*\*\[\s*Find support where I live\s*\]\*\*\s*$/gm,
                              ""
                            ),
                            to
                          )
                        )}
                        tight
                      />,
                    ])
                  )}
                  cards={pathCards}
                  cardHrefs={pathCards.map((c) =>
                    /seek help first/i.test(c.label) ? help : resetSimpleHref("lesson-05")
                  )}
                  helpHref={help}
                  showLabel="Show my guidance"
                />
              </section>
            );
          }
        }

        // What to do in danger, set apart so it is not read as one more
        // section. It comes first on the pages that carry it, and a learner in
        // crisis has to be able to find it without reading anything else.
        if (/^if you need help right now$/i.test(heading)) {
          return (
            <section
              key={i}
              className="mt-8 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-5 py-5"
            >
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {heading}
              </h2>
              <MindMarkdown
                source={withoutMarkers(linkLandmarks(body, to))}
                tight
              />
            </section>
          );
        }

        // Start Here 3's three starting points are the page, not decoration.
        //
        // Gated on the page, not on the markers. "[ Card ]" is how four pages
        // write a choice — Lesson 5's retreats, Check-in 1's paths, Welcome
        // Home's next pause — and matching on the marker alone caught Lesson 5
        // here and returned before its own renderer ran, leaving its cards as
        // a bullet list and its box and checkbox as raw text.
        const cards = page.slug === "choose-starting-point" ? routeCards(body) : [];
        if (cards.length > 0) {
          return (
            <section key={i} className="mt-10">
              <h2
                className="text-2xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {heading}
              </h2>
              <MindMarkdown source={linkLandmarks(withoutMarkers(withoutRouteCards(body)), to)} tight />
              <ResetRouteCards
                cards={cards}
                chosen={chosenRoute}
                next={resetSimpleHref("safety-and-support")}
              />
            </section>
          );
        }

        // The "☐ …" line is the completion control, and it is rendered where
        // the page puts it — under the instruction it completes, above the
        // divider and the links beneath.
        // Prose and controls in the order the file puts them, so a card, a
        // box or a checkbox stands where the page says it stands. Appending
        // them under the section put Lesson 5's retreat cards at the foot of
        // the page instead of under "1. Choose your retreat".
        const blocks = blocksOf(body, heading, page.slug === "lesson-05");
        const plans = page.slug === "lesson-05" ? planCards(body) : null;
        const hasPlans = Boolean(plans && plans.main.length > 0);
        const quiet = /^(key scripture|need support\??)$/i.test(heading);
        let boxAt = -1;

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

            {blocks.map((block, b) => {
              if (block.kind === "prose") {
                // Only the block that opens a section is tight against its
                // heading. "tight" zeroes the top margin of a block's first
                // child, so prose that follows a control lost the space above
                // it — Lesson 5's "2. Choose your place" sat against the
                // retreat cards rather than clear of them.
                return (
                  <MindMarkdown
                    key={b}
                    source={linkLandmarks(withoutMarkers(block.text), to)}
                    tight={b === 0}
                  />
                );
              }
              if (block.kind === "plans") {
                return plans && hasPlans ? (
                  <ResetPlanCards
                    key={b}
                    main={plans.main}
                    others={plans.others}
                    chosen={chosenPlan}
                    othersLabel={plans.othersLabel ?? "Show other retreat formats"}
                    othersHeading="Other ways to use this retreat"
                  />
                ) : null;
              }
              if (block.kind === "checks") {
                return <ResetLocalChecks key={b} items={block.items} />;
              }
              if (block.kind === "box") {
                boxAt += 1;
                const at = boxAt;
                return (
                  <ResetReflection
                    key={b}
                    pageSlug={page.slug}
                    index={at}
                    label={block.label}
                    saved={answers.get(at) ?? ""}
                  />
                );
              }
              return (
                <ResetStep
                  key={b}
                  pageSlug={page.slug}
                  label={block.label}
                  done={done}
                  disabled={hasPlans && !chosenPlan}
                  disabledHint="Choose your retreat above first."
                />
              );
            })}
          </section>
        );
      })}

      {/* Safety and Support ends on its own two buttons, which its file writes
          as markers. The ordinary next-step block is not shown beneath them: a
          third way on, phrased as the obvious one, is the opposite of what a
          page about knowing when to stop should end with. */}
      {questions.length > 0 ? null : page.slug === "safety-and-support" ? (
        <ResetContinue
          pageSlug={page.slug}
          continueHref={resetSimpleHref(afterSafety(chosenRoute))}
          continueLabel="I understand and want to continue"
          helpHref={help}
          helpLabel="Help me find support where I live"
          helpFirst={chosenRoute === "r3"}
        />
      ) : (
      <nav className="mt-10">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          What would you like to do next?
        </h2>
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
          {next && (
            <Link
              href={resetSimpleHref(next.slug)}
              className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
            >
              Next: {next.title}
            </Link>
          )}
          <Link
            href={RESET_BASE}
            className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-5 py-3 text-center text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] sm:border-0 sm:px-0 sm:py-0 sm:text-[#5C5147] sm:underline sm:underline-offset-4 sm:hover:text-[#2B2118]"
          >
            Stop here for today
          </Link>
        </div>
      </nav>
      )}
    </main>
  );
}
