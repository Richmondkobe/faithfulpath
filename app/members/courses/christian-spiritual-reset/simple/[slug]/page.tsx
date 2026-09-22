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
import ResetBegin from "@/components/reset/ResetBegin";
import ResetTimer from "@/components/reset/ResetTimer";
import ResetChangePlan from "@/components/reset/ResetChangePlan";
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
  PROGRAMME_PAGE,
  SESSION_PLANS,
  linkSessions,
  planCards,
  planViewFor,
  sessionInPlan,
  sessionProgressSlug,
  sessionVersionFor,
  checkinGuidance,
  checkinQuestions,
  routeCards,
  routeFinished,
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
  "retreat-plan",
  "session-01",
  "session-02",
  "session-03",
  "session-04",
  "session-05",
  "session-06",
  "session-07",
  "session-08",
  "session-09",
  "session-10",
  "lesson-20",
  "lesson-21",
  "lesson-22",
  "lesson-23",
  "lesson-24",
  "welcome-home",
  "day-30-review",
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
    page.slug === "choose-starting-point" ||
    page.slug === "safety-and-support" ||
    page.slug === "retreat-plan"
      ? await getResetRoute()
      : null;
  // Lesson 5 is where a retreat is chosen, and its completion waits on one.
  const needsPlan =
    page.slug === "lesson-05" ||
    page.slug === "retreat-plan" ||
    page.slug === "lesson-24" ||
    page.slug === "welcome-home" ||
    page.slug.startsWith("session-");
  const chosenPlan = needsPlan ? await getResetPlan() : null;
  const answers = await getLessonReflections(RESET_SLUG, page.slug);
  const progress = await getCourseProgress(RESET_SLUG);
  // A session is finished on the route it was taken on, not for every length
  // of itself. Every other page is simply its own slug.
  const stepSlug = page.slug.startsWith("session-")
    ? sessionProgressSlug(page.slug, chosenPlan)
    : page.slug;
  const done = Boolean(progress.get(stepSlug)?.completed_at);

  // Each page names its own Go Deeper destination; Safety and Support is the
  // same page for everyone, and is not linked from itself.
  const help = lessonHref(RESET_SLUG, "00-finding-help-where-you-live");
  const to = {
    deeper: page.deeper[0] ? lessonHref(RESET_SLUG, page.deeper[0]) : null,
    safety: page.slug === "safety-and-support" ? null : resetSimpleHref("safety-and-support"),
    help,
  };

  const view = page.slug === "retreat-plan" ? planViewFor(chosenPlan, chosenRoute) : null;

  // "Change my plan" offers the same seven choices as Lesson 5, read from
  // Lesson 5's own file rather than written out again here — one list, so the
  // two pages cannot come to disagree about what the retreats are.
  const planChoices = (() => {
    if (page.slug !== "retreat-plan") return null;
    const l5 = findResetSimplePage("lesson-05");
    const md5 = l5 ? readResetSimplePage(l5.file) : null;
    if (!md5) return null;
    const step = resetSections(bodyOf(md5)).find((x) => /take one step/i.test(x.heading));
    return step ? planCards(step.body) : null;
  })();

  // A session shows one version, chosen by the retreat the learner is on.
  const version = page.slug.startsWith("session-") ? sessionVersionFor(chosenPlan) : null;

  // The guided prayer is the recording the course already has, under the flat
  // audio/ folder where the Spiritual Reset's prayers have always lived. It is
  // not re-recorded for this layer.
  const prayerSrc = page.prayer ? await signedMediaUrl("audio", `${page.prayer}.mp3`) : null;

  // The day introduction, offered only on the full version — the plan it
  // belongs to. The Spiritual Reset's videos sit flat under videos/, where
  // they have always been.
  const videoSrc =
    page.video && (chosenPlan === null || chosenPlan === "p3d")
      ? await signedMediaUrl("videos", `${page.video}.mp4`)
      : null;

  // Lesson 24's month carries the four weekly encouragement videos, which the
  // course already has, one per week. Its note places them inside "Your month
  // at a glance" rather than in a block of their own.
  const WEEKS = [
    { n: 1, id: "week-1-landing", name: "Landing" },
    { n: 2, id: "week-2-doing", name: "Doing" },
    { n: 3, id: "week-3-shaping", name: "Shaping" },
    { n: 4, id: "week-4-settling", name: "Settling" },
  ];
  const weekVideos =
    page.slug === "lesson-24"
      ? await Promise.all(
          WEEKS.map(async (w) => ({
            ...w,
            src: await signedMediaUrl("videos", `${w.id}.mp4`),
          }))
        )
      : [];

  // And it offers the flex sessions only to a three-day learner who still has
  // one to take. Offering them to anybody else describes a retreat they did
  // not do; offering them to somebody who took all three is simply wrong.
  const flexLeft =
    page.slug === "lesson-24" &&
    chosenPlan === "p3d" &&
    ["session-06", "session-08", "session-09"].some(
      (s) => !progress.get(`${s}-p3d`)?.completed_at
    );

  // Welcome Home says one of three things, or gently says not yet. Which, is
  // decided by what the learner has actually finished on their own route.
  const finish =
    page.slug === "welcome-home"
      ? routeFinished(chosenPlan, (s) => Boolean(progress.get(s)?.completed_at))
      : null;

  const welcomeHomeVideo =
    page.slug === "welcome-home" ? await signedMediaUrl("videos", "welcome-home.mp4") : null;

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

  // Five sessions have one version and no "## … VERSION" heading: they belong
  // to the three-day retreat alone, so their whole body is the page.
  const isSession = page.slug.startsWith("session-");
  const oneVersion = isSession && !sections.some((s) => /VERSION/i.test(s.heading));

  // And a session the learner's retreat does not contain is not rendered as
  // though it were part of it.
  const inPlan = isSession ? sessionInPlan(page.slug, chosenPlan) : true;

  // A session's body, whichever version it is — and five sessions have only
  // one, written without a "## … VERSION" heading because the three-day
  // retreat is the only retreat that contains them. Both paths render the same
  // way: the narration, the day's video where there is one, the guided prayer,
  // then the session itself.
  const sessionBody = (heading: string, body: string, key: number | string) => {
    const day = /day-(\d)-introduction/.exec(page.video ?? "")?.[1];
    return (
      <section key={key} className="mt-10">
        <ResetAudio
          src={src}
          length={page.length}
          transcript={<MindMarkdown source={transcript} tight />}
        />
        {videoSrc && day && (
          <p className="mt-4">
            <a
              href={videoSrc}
              className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              Watch the Day {day} introduction (optional)
            </a>
          </p>
        )}
        {prayerSrc && (
          <div className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
              Guided prayer
            </p>
            <audio controls preload="none" className="mt-3 w-full">
              <source src={prayerSrc} type="audio/mpeg" />
              Your browser cannot play this recording.
            </audio>
          </div>
        )}
        {blocksOf(body, heading).map((block, b) => {
          if (block.kind === "prose") {
            return (
              <MindMarkdown
                key={b}
                source={linkSessions(
                  linkLandmarks(withoutMarkers(withoutSubtitle(block.text)), to),
                  resetSimpleHref
                )}
                tight={b === 0}
              />
            );
          }
          if (block.kind === "timer") return <ResetTimer key={b} minutes={block.minutes} />;
          if (block.kind === "checks") return <ResetLocalChecks key={b} items={block.items} />;
          if (block.kind === "box") {
            return (
              <ResetReflection
                key={b}
                pageSlug={page.slug}
                index={0}
                label={block.label}
                saved={answers.get(0) ?? ""}
              />
            );
          }
          if (block.kind === "step") {
            return (
              <ResetStep key={b} pageSlug={stepSlug} label={block.label} done={done} />
            );
          }
          if (block.kind === "skip") {
            // Two different things are written the same way. "Skip the written
            // exercise" moves down the page to Close — Session 5's note says
            // so, and says it records nothing, not even that it was skipped.
            // The others leave the session for the plan. Neither marks
            // anything complete: skipping is not finishing.
            const inPage = /written exercise/i.test(block.label);
            return (
              <p key={b} className="mt-5">
                <a
                  href={inPage ? "#close" : resetSimpleHref("retreat-plan")}
                  className="inline-flex w-full items-center justify-center rounded-sm border border-[#D9CDBA] px-5 py-3 text-center text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] sm:w-auto"
                >
                  {block.label}
                </a>
              </p>
            );
          }
          return null;
        })}
      </section>
    );
  };

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

      {planChoices && planChoices.main.length > 0 && (
        <ResetChangePlan
          label="Change my plan"
          main={planChoices.main}
          others={planChoices.others}
          chosen={chosenPlan}
          othersLabel={planChoices.othersLabel ?? "Show other retreat formats"}
        />
      )}

      {/* A session that belongs to a longer retreat than the one the learner
          chose. They are told so, and where to go, rather than being shown a
          session their plan does not contain or a page that refuses to load. */}
      {!inPlan && (
        <section className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
          <p className="text-[15px] leading-relaxed text-[#4A4038]">
            This session belongs to the three-day retreat
            {SESSION_PLANS[page.slug]?.includes("p1d") ? " and the one-day retreat" : ""}, and
            the retreat you chose does not include it. Nothing is locked — you
            can change your plan at any time, and everything you have finished
            stays finished.
          </p>
          <p className="mt-4">
            <Link
              href={resetSimpleHref("retreat-plan")}
              className="inline-flex w-full items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] sm:w-auto"
            >
              Back to my retreat plan
            </Link>
          </p>
        </section>
      )}

      {/* Five sessions are written without a version heading, so their whole
          body is the opening block. It gets the session treatment, not the
          plain prose one. */}
      {inPlan && oneVersion && opening && sessionBody("", opening, "one-version")}

      {inPlan && !oneVersion && opening && (
        <div className="mt-6 text-[#4A4038]">
          <MindMarkdown source={linkLandmarks(withoutSubtitle(withoutMarkers(opening)), to)} tight />
        </div>
      )}

      {inPlan && sections.map(({ heading, body }, i) => {
        if (!heading) return null;

        // The Listen section becomes the real control, with the transcript
        // closed underneath it, where the page puts it.
        if (/^listen$/i.test(heading)) {
          return (
            <div key={i}>
              <ResetAudio
                src={src}
                length={page.length}
                transcript={<MindMarkdown source={transcript} tight />}
              />
              {/* Welcome Home's video sits under the audio, where its note
                  moves it to from the old Lesson 24 page. */}
              {welcomeHomeVideo && (
                <p className="mt-4">
                  <a
                    href={welcomeHomeVideo}
                    className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                  >
                    Watch the Welcome Home video (optional)
                  </a>
                </p>
              )}
            </div>
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

        // A session's versions: one is rendered, the others are not.
        if (version && /VERSION/i.test(heading)) {
          if (!version.test(heading)) return null;
          return sessionBody(heading, body, i);
        }

        // My Retreat Plan carries five views and shows one. The others are
        // not hidden with CSS; they are not rendered, so a learner cannot
        // reach a retreat they did not choose by reading the page source.
        if (view && /^(PLAN VIEW|QUICK START VIEW|OTHER RETREAT FORMATS)/i.test(heading)) {
          if (!view.heading.test(heading)) return null;
          return (
            <section key={i} className="mt-10">
              <h2
                className="text-2xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {heading.replace(/^(PLAN VIEW:|QUICK START VIEW)\s*/i, "").replace(/\s*\*\([^)]*\)\*\s*$/, "") || "Your plan"}
              </h2>
              {blocksOf(body, heading).map((block, b) =>
                block.kind === "checks" ? (
                  <ResetLocalChecks key={b} items={block.items} />
                ) : block.kind === "prose" ? (
                  <MindMarkdown
                    key={b}
                    source={linkSessions(
                      linkLandmarks(withoutMarkers(withoutSubtitle(block.text)), to),
                      resetSimpleHref
                    )}
                    tight={b === 0}
                  />
                ) : null
              )}
            </section>
          );
        }

        // What to do in danger, set apart so it is not read as one more
        // section. It comes first on the pages that carry it, and a learner in
        // crisis has to be able to find it without reading anything else.
        // Welcome Home's acknowledgement: one of the three, or the gentle line.
        //
        // The three are "### " blocks inside this section, and only the one
        // that is true is rendered. Somebody who has not finished is not shown
        // a completion message they could mistake for their own, and no
        // certificate is offered — its note is explicit that the certificate
        // goes with the full-course acknowledgement and nothing else.
        if (finish && /^YOUR ACKNOWLEDGEMENT$/i.test(heading)) {
          const wanted =
            finish.kind === "oneday"
              ? /^One-day route/i
              : finish.kind === "threehour"
                ? /^Three-hour route/i
                : /^Full course/i;
          const block = checkinGuidance(body).length
            ? null
            : body
                .split(/^###\s+/m)
                .slice(1)
                .find((b) => wanted.test(b));

          if (!finish.finished) {
            const nextPage = finish.next ? findResetSimplePage(finish.next) : null;
            return (
              <section
                key={i}
                className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5"
              >
                <p className="text-[15px] leading-relaxed text-[#4A4038]">
                  You have not finished every step yet. That is all right.
                  {nextPage ? " Your next step is:" : ""}
                </p>
                {nextPage && (
                  <p className="mt-4">
                    <Link
                      href={resetSimpleHref(nextPage.slug)}
                      className="inline-flex w-full items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] sm:w-auto"
                    >
                      {nextPage.title}
                    </Link>
                  </p>
                )}
              </section>
            );
          }

          return (
            <section key={i} className="mt-10">
              {block && (
                <MindMarkdown
                  source={withoutMarkers(
                    withoutSubtitle(
                      // The heading of the block is the route's name, which the
                      // acknowledgement itself already says.
                      block.replace(/^[^\n]*\n/, "")
                    )
                  )}
                  tight
                />
              )}
            </section>
          );
        }

        // Lesson 24's month: the four weekly videos become real links, and
        // the flex-session line is shown only to the learners it is true for.
        if (page.slug === "lesson-24" && /month at a glance/i.test(heading)) {
          const month = body
            .replace(/^\s*\*Optional: short weekly encouragement videos[^*\n]*\*\s*$/gm, "")
            .replace(
              flexLeft ? /$^/ : /^\s*\*If you took the three-day retreat[^*\n]*\*\s*$/gm,
              ""
            );
          return (
            <section key={i} className="mt-10">
              <h2
                className="text-2xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {heading}
              </h2>
              <MindMarkdown
                source={linkSessions(
                  linkLandmarks(withoutMarkers(withoutSubtitle(month)), to),
                  resetSimpleHref
                )}
                tight
              />
              {weekVideos.some((w) => w.src) && (
                <div className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                    Weekly encouragement (optional)
                  </p>
                  <ul className="mt-2 space-y-1">
                    {weekVideos.map((w) =>
                      w.src ? (
                        <li key={w.id}>
                          <a
                            href={w.src}
                            className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                          >
                            Week {w.n} — {w.name}
                          </a>
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>
              )}
            </section>
          );
        }

        // Lessons 20 and 24 head theirs "Important: safety comes first" and
        // "Safety comes first". Their notes say the block may not be
        // collapsed, so it is set apart and open, like the others.
        if (/^(if you need help right now|(important: )?safety comes first)$/i.test(heading)) {
          return (
            <section
              key={i}
              className="mt-8 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-5 py-5"
            >
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {heading}
              </h2>
              <MindMarkdown
                source={withoutMarkers(withoutSubtitle(linkLandmarks(body, to)))}
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
              <MindMarkdown source={linkLandmarks(withoutMarkers(withoutSubtitle(withoutRouteCards(body))), to)} tight />
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
                    source={linkLandmarks(withoutMarkers(withoutSubtitle(block.text)), to)}
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
              if (block.kind === "timer") {
                return <ResetTimer key={b} minutes={block.minutes} />;
              }
              return (
                <ResetStep
                  key={b}
                  pageSlug={stepSlug}
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
      {/* One primary button, below whichever view was shown. For a specialist
          format it opens that programme page instead, which is where that
          plan actually lives. */}
      {view && view.kind !== "none" && (
        <ResetBegin
          pageSlug={page.slug}
          href={
            view.kind === "other"
              ? lessonHref(RESET_SLUG, PROGRAMME_PAGE[chosenPlan ?? ""] ?? "23-choose-your-retreat-format")
              : resetSimpleHref("session-01")
          }
          label={view.kind === "other" ? "Open my retreat plan" : "Begin Session 1"}
          setPlanToThreeHour={view.kind === "quickstart" && chosenPlan === null}
        />
      )}

      {view && view.kind === "none" && (
        <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
          <p className="text-[15px] leading-relaxed text-[#4A4038]">
            You have not chosen a retreat yet, so there is no plan to show.
          </p>
          <p className="mt-4">
            <Link
              href={resetSimpleHref("lesson-05")}
              className="inline-flex w-full items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] sm:w-auto"
            >
              Choose your retreat first
            </Link>
          </p>
        </section>
      )}

      {questions.length > 0 || view || version ? null : page.slug === "safety-and-support" ? (
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
