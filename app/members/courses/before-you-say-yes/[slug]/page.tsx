import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  SUPPORT_FILE, findPage, findRoute, getPages, linkReferences, pageSlug,
  parseChoices, plainText, positionOnRoute, readPage, readSupportPage,
  splitAtHeading, splitBulletBlocks,
} from "@/lib/bysy-course";
import { BYSY_BASE, bysySupportHref } from "@/lib/bysy-links";
import { getStoredRoute, getToolAnswer } from "@/lib/bysy-progress";
import { chapterReferrer, lessonLabel } from "@/lib/bysy-simple";
import { simpleHref } from "@/lib/bysy-simple-links";
import { getCourseComplete } from "../actions";
import MindMarkdown from "@/components/mind/MindMarkdown";
import NextStepOptions from "@/components/bysy/NextStepOptions";
import EvidenceTable from "@/components/bysy/EvidenceTable";
import DatedEntries from "@/components/bysy/DatedEntries";
import EarlierAnswers, { type Recall } from "@/components/bysy/EarlierAnswers";
import PrivateWorksheet from "@/components/bysy/PrivateWorksheet";
import JointGate from "@/components/bysy/JointGate";
import QuestionSet from "@/components/bysy/QuestionSet";
import ChoiceList from "@/components/bysy/ChoiceList";
import CompletionRecord from "@/components/bysy/CompletionRecord";

export const metadata: Metadata = {
  title: "Before You Say Yes | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
};

export function generateStaticParams() {
  return getPages().map((p) => ({ slug: pageSlug(p) }));
}

/**
 * Any of the 35 content pages.
 *
 * No page is locked by a route. A route is a starting point: it decides what
 * position the progress line reports, never what may be opened.
 */
export default async function BysyPage({ params, searchParams }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  // Arrived from a simple lesson as its "Read the book chapter"? Then this page
  // is a chapter, not page 9 of 35 — a reader following a link from Lesson 2
  // should not be told they are somewhere else in a course they are not on.
  const cameFrom = chapterReferrer((await searchParams).from);
  const page = findPage(slug);
  if (!page) notFound();

  // The support page is composed from two sources: its guidance is course text,
  // its country lists and review date come from the shared resources file.
  const support = page.file === SUPPORT_FILE ? readSupportPage() : null;
  const body = support ? support.markdown : readPage(page.file);
  if (!body) notFound();

  // A named section missing from the shared file would leave a hole where the
  // helplines belong. Say so rather than render a support page that looks
  // complete and is not.
  if (support && support.missing.length > 0) {
    console.error(
      support.unavailable
        ? "Support page: the shared resources file is missing, unreadable or empty."
        : `Support page: sections missing from the shared resources file: ${support.missing.join(", ")}`
    );
  }

  // Lesson 6's next-step list becomes a control that routes rather than lists:
  // §3 requires a safety selection to replace the other options rather than sit
  // beside them, and §4 requires that none of it is stored.
  const nextStep =
    page.lesson === 6 ? splitAtHeading(body, "## Next faithful step") : null;

  // §7's records kept over time. The categories are the page's own — the nine
  // windows and the ten green flags — so the list a learner picks from is the
  // list they have just read.
  const WINDOWS = [
    "Family relationships and boundaries",
    "People from whom they have nothing to gain",
    "Former partners",
    "Authority, responsibility and accountability",
    "Money",
    "Disappointment, including when I am the cause",
    "Correction",
    "Temptation and small dishonesties",
    "How they speak about other people",
  ];
  const GREEN_FLAGS = [
    "They respect my no",
    "They make room for honest disagreement",
    "They take responsibility and repair harm",
    "Their words and behaviour increasingly align",
    "They respect my separate relationships and identity",
    "They show emotional steadiness without demanding perfection",
    "They tell relevant truths even when inconvenient",
    "They are teachable and able to reconsider",
    "They celebrate healthy growth without controlling its direction",
    "The relationship allows mutuality",
  ];

  const dated =
    page.lesson === 5
      ? splitAtHeading(body, "### Part A — The nine windows")
      : page.lesson === 7
        ? splitAtHeading(body, "### Part A — Green flags I have actually seen")
        : null;
  const datedRows = dated ? (await getToolAnswer<string[][]>(slug, "A")) ?? [] : [];

  // Lesson 4 Part B: §7 names this table specifically — the learner adds rows
  // rather than being offered a fixed three.
  const evidence =
    page.lesson === 4 ? splitAtHeading(body, "### Part B — What I feel and what I know") : null;
  const evidenceRows = evidence
    ? (await getToolAnswer<string[][]>(slug, "B")) ?? []
    : [];

  // §7's cross-lesson recall. The targets are the tools each page names, so the
  // control offers what the content asks the learner to check — not everything
  // they have ever written.
  const RECALL: Record<number, Recall[]> = {
    7: [
      { pageSlug: "lesson-02-equally-yoked", part: "A", label: "Lesson 2 — Spiritual Compatibility" },
      { pageSlug: "lesson-03-know-yourself", part: "A", label: "Lesson 3 — Requirements" },
      { pageSlug: "lesson-05-character-before-charisma", part: "A", label: "Lesson 5 — Character Observation Sheet" },
      { pageSlug: "lesson-06-red-flags-christians-spiritualise", part: "B", label: "Lesson 6 — Red Flag Checklist" },
    ],
    15: [
      { pageSlug: "lesson-05-character-before-charisma", part: "A", label: "Lesson 5 — Character Observation Sheet" },
      { pageSlug: "lesson-07-quiet-green-flags", part: "A", label: "Lesson 7 — Green flags I have seen" },
    ],
    17: [
      { pageSlug: "lesson-05-character-before-charisma", part: "A", label: "Lesson 5 — Character Observation Sheet" },
      { pageSlug: "lesson-07-quiet-green-flags", part: "A", label: "Lesson 7 — Green flags I have seen" },
      { pageSlug: "lesson-06-red-flags-christians-spiritualise", part: "B", label: "Lesson 6 — Red Flag Checklist" },
    ],
    18: [
      { pageSlug: "lesson-06-red-flags-christians-spiritualise", part: "B", label: "Lesson 6 — Red Flag Checklist" },
      { pageSlug: "lesson-05-character-before-charisma", part: "A", label: "Lesson 5 — Character Observation Sheet" },
    ],
  };
  const recall: Recall[] | null =
    (page.lesson !== undefined ? RECALL[page.lesson] : undefined) ??
    (page.file === "module-6-02-questions-before-engagement.md"
      ? [
          { pageSlug: "lesson-05-character-before-charisma", part: "A", label: "Lesson 5 — Character Observation Sheet" },
          { pageSlug: "lesson-07-quiet-green-flags", part: "A", label: "Lesson 7 — Green flags I have seen" },
          { pageSlug: "lesson-15-can-we-build-a-life", part: "A", label: "Lesson 15 — Life Compatibility Reflection" },
        ]
      : null);

  // §5's joint tools. Two halves on one page: a private part that saves to this
  // account and nowhere else, and a shared part that opens only behind the gate.
  // The areas and prompts are the page's own, in its own wording, so the form
  // asks exactly what the learner has just read.
  const JOINT: Record<string, {
    a: { heading: string; title: string; areas: string[]; prompts: string[]; rowLabel: string; guidance: string };
    b: { heading: string; title: string; prompts: string[]; guidance: string };
  }> = {
    "lesson-08-boundaries-without-shame": {
      a: {
        heading: "### Part A — My boundaries",
        title: "Part A — My boundaries",
        rowLabel: "Area",
        areas: ["Emotional", "Spiritual", "Digital", "Financial", "Time", "Relational"],
        prompts: [
          "The value or need this boundary protects:",
          "I will:",
          "I will not:",
          "How I will communicate it:",
          "If this line is crossed, the action realistically within my control:",
          "Who can support me if maintaining it becomes difficult:",
        ],
        guidance: "Be specific. “I will be careful about money” is not a boundary; “I will not lend or borrow money in this relationship” is.",
      },
      b: {
        heading: "### Part B — Our agreement",
        title: "Part B — Our agreement",
        prompts: [
          "My boundary:",
          "Their boundary:",
          "Requests either of us made:",
          "Our shared agreement:",
          "Any unresolved difference, and whether it reveals incompatibility:",
        ],
        guidance: "Write what you have both agreed may be written down. Do not let the more assertive person’s preference become “our agreement” by default.",
      },
    },
    "lesson-15-can-we-build-a-life": {
      a: {
        heading: "### Part A — Alone",
        title: "Part A — Alone",
        rowLabel: "Area",
        areas: [
          "Personality and temperament",
          "Communication and conflict",
          "Calling and direction",
          "Location",
          "Expectations of marriage",
          "Children",
          "Lifestyle",
        ],
        prompts: [
          "What I know about myself:",
          "What I have observed about them:",
          "The difference, if any:",
        ],
        guidance: "The questions under each area above are what to think about. Write only what you want to keep.",
      },
      b: {
        heading: "### Part B — Together",
        title: "Part B — Together",
        prompts: [
          "Where we agree:",
          "Where we differ:",
          "Whether the difference is preference or conviction:",
          "Whether either of us has been assuming the other had accepted something we never said:",
        ],
        guidance: "Area by area, after you have shared what each of you wrote.",
      },
    },
  };

  const jointSpec = JOINT[slug];
  const joint = (() => {
    if (!jointSpec) return null;
    const a = splitAtHeading(body, jointSpec.a.heading);
    if (!a) return null;
    const b = splitAtHeading(a.after, jointSpec.b.heading);
    if (!b) return null;
    return { spec: jointSpec, intro: a.before, aBody: a.section, between: b.before, bBody: b.section, rest: b.after };
  })();
  const jointA = joint ? (await getToolAnswer<string[][]>(slug, "A")) ?? [] : [];
  // Only whether the private part has anything in it — never the shared record
  // itself, which the gate fetches for itself once it is open.
  const jointADone = jointA.some((row) => row.some((cell) => cell.trim() !== ""));

  // Questions Before Engagement: ten sections, 64 questions, built from the
  // page rather than retyped into it. One part per section, because a part
  // holds 40 rows. The whole of it is the private half of a joint tool — §4
  // names it, and nothing here is exportable.
  const QBE_FILE = "module-6-02-questions-before-engagement.md";
  const qbe = page.file === QBE_FILE ? (() => {
    const headings = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^### \d+\. /.test(l));
    if (headings.length === 0) return null;

    const first = splitAtHeading(body, headings[0]);
    if (!first) return null;

    const sections = headings.map((heading, i) => {
      const at = splitAtHeading(body, heading);
      const inner = at ? at.section.split("\n").slice(1).join("\n") : "";
      const blocks = splitBulletBlocks(inner);
      // Section 10 opens with a three-way answer rather than a question.
      const isDecision = /^### 10\./.test(heading);
      const lists = blocks.filter((b) => b.kind === "list");
      const choiceItems = isDecision && lists.length > 1 ? lists[0].items : null;
      const questions = (choiceItems ? lists.slice(1) : lists).flatMap((b) => b.items);
      return {
        heading: plainText(heading.replace(/^###\s+/, "")),
        part: `Q${i + 1}`,
        blocks,
        choiceItems,
        questions: questions.map(plainText),
      };
    });

    // "Comparing your answers" is where the two of you speak. It is the shared
    // section of this tool, and it goes behind the gate.
    const comparing = splitAtHeading(body, "## Comparing your answers");
    if (!comparing) return null;

    return { intro: first.before, sections, comparing };
  })() : null;

  const qbeSaved = qbe
    ? await Promise.all(
        qbe.sections.map((s) => getToolAnswer<string[][]>(slug, s.part).then((r) => r ?? []))
      )
    : [];
  const qbePrivateDone = qbeSaved.some((rows) =>
    rows.some((row) => row.some((cell) => cell.trim() !== ""))
  );

  // §3's routing rule on the three remaining pages that offer a safety route
  // among ordinary choices. The options and which of them are safety routes are
  // read from each page, not restated here.
  const CHOICES: Record<string, { heading: string; title: string; prompt: string }> = {
    "pause-04-what-does-the-evidence-require": {
      heading: "## Where that leaves you",
      title: "Where that leaves you",
      prompt: "Choose the one that fits now. You may change it, and none is a better result than the others.",
    },
    "my-next-faithful-step": {
      heading: "## Choose one",
      title: "Choose one",
      prompt: "One step. Not the eventual hope — the next thing.",
    },
    "lesson-16-good-christians-wrong-for-each-other": {
      heading: "## Next faithful step",
      title: "Next faithful step",
      prompt: "Choose the one that fits. None is better than the others, and you may return and change it.",
    },
  };
  const choiceSpec = CHOICES[slug];
  const choices = (() => {
    if (!choiceSpec) return null;
    const at = splitAtHeading(body, choiceSpec.heading);
    if (!at) return null;
    const items = parseChoices(at.section.split("\n").slice(1).join("\n"));
    if (items.length === 0) return null;
    return { spec: choiceSpec, before: at.before, items, after: at.after };
  })();

  // §2's completion record, on the last page of the course.
  const isFinalPage = page.n === getPages().length;
  const courseComplete = isFinalPage ? await getCourseComplete() : false;

  const route = findRoute(await getStoredRoute());
  const onRoute = route ? positionOnRoute(route, page.file) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-10 sm:pt-14">
      <Link
        href={cameFrom ? simpleHref(cameFrom.slug) : BYSY_BASE}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        {cameFrom ? `← Back to ${lessonLabel(cameFrom)}` : "← Before You Say Yes"}
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {cameFrom ? (
          `Book chapter for ${lessonLabel(cameFrom)}`
        ) : (
          <>
            {page.module}
            {/* Position, never a percentage against a target and never a streak.
                A learner off their route sees their place in the whole course. */}
            {onRoute
              ? ` · Page ${onRoute.at} of ${onRoute.of} on your route`
              : ` · Page ${page.n} of ${getPages().length}`}
          </>
        )}
      </p>

      <article className="mt-2">
        {choices ? (
          <>
            <MindMarkdown source={linkReferences(choices.before, page.file)} />
            <h2
              className="mt-10 text-2xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {choices.spec.title}
            </h2>
            <ChoiceList choices={choices.items} prompt={choices.spec.prompt} />
            <MindMarkdown source={linkReferences(choices.after, page.file)} />
          </>
        ) : qbe ? (
          <>
            <MindMarkdown source={linkReferences(qbe.intro, page.file)} />
            {qbe.sections.map((section) => (
              <section key={section.part} className="mt-10">
                <h3
                  className="text-xl text-[#2B2118]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {section.heading}
                </h3>
                {section.blocks
                  .filter((b) => b.kind === "prose")
                  .map((b, i) => (
                    <MindMarkdown key={i} source={linkReferences(b.text, page.file)} />
                  ))}
                <QuestionSet
                  pageSlug={slug}
                  part={section.part}
                  questions={section.questions}
                  saved={qbeSaved[qbe.sections.indexOf(section)]}
                  showMonitoringNote={section.part === "Q1"}
                  choice={
                    section.choiceItems
                      ? {
                          prompt: "Choose one.",
                          options: section.choiceItems.map((o) => plainText(o)),
                        }
                      : undefined
                  }
                />
              </section>
            ))}
            <h2
              className="mt-12 text-2xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              Comparing your answers
            </h2>
            <MindMarkdown
              source={linkReferences(qbe.comparing.section.split("\n").slice(1).join("\n"), page.file)}
            />
            <JointGate
              privatePartDone={qbePrivateDone}
              privatePartLabel="Answering the questions separately"
              shared={{
                pageSlug: slug,
                part: "S",
                areas: ["What we agreed to write down"],
                prompts: [
                  "Where our answers differed, and what each of us meant:",
                  "What remains unresolved:",
                  "What we agreed to do next:",
                ],
                rowLabel: "Together",
                guidance:
                  "Only what you have both agreed may be written down. Neither of you is required to show the other your own answers.",
              }}
            />
            <MindMarkdown source={linkReferences(qbe.comparing.after, page.file)} />
          </>
        ) : joint ? (
          <>
            <MindMarkdown source={linkReferences(joint.intro, page.file)} />
            <h3
              className="mt-8 text-xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {joint.spec.a.title}
            </h3>
            <MindMarkdown source={linkReferences(joint.aBody.split("\n").slice(1).join("\n"), page.file)} />
            <PrivateWorksheet
              pageSlug={slug}
              part="A"
              areas={joint.spec.a.areas}
              prompts={joint.spec.a.prompts}
              rowLabel={joint.spec.a.rowLabel}
              saved={jointA}
              guidance={joint.spec.a.guidance}
            />
            <MindMarkdown source={linkReferences(joint.between, page.file)} />
            <h3
              className="mt-8 text-xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {joint.spec.b.title}
            </h3>
            <MindMarkdown source={linkReferences(joint.bBody.split("\n").slice(1).join("\n"), page.file)} />
            <JointGate
              privatePartDone={jointADone}
              privatePartLabel={joint.spec.a.title}
              shared={{
                pageSlug: slug,
                part: "B",
                areas: joint.spec.a.areas,
                prompts: joint.spec.b.prompts,
                rowLabel: joint.spec.a.rowLabel,
                guidance: joint.spec.b.guidance,
              }}
            />
            <MindMarkdown source={linkReferences(joint.rest, page.file)} />
          </>
        ) : dated ? (
          <>
            <MindMarkdown source={linkReferences(dated.before, page.file)} />
            <h3
              className="mt-8 text-xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {page.lesson === 5
                ? "Part A — The nine windows"
                : "Part A — Green flags I have actually seen"}
            </h3>
            <MindMarkdown source={linkReferences(dated.section.split("\n").slice(1).join("\n"), page.file)} />
            <DatedEntries
              pageSlug={slug}
              part="A"
              saved={datedRows}
              categories={page.lesson === 5 ? WINDOWS : GREEN_FLAGS}
              categoryLabel={page.lesson === 5 ? "Window" : "Green flag"}
              statuses={
                page.lesson === 7
                  ? ["Observed", "Not yet observed", "Mixed evidence", "Concern observed"]
                  : undefined
              }
              evidenceLabel={
                page.lesson === 5
                  ? "What I actually observed"
                  : "Evidence — what was said or done"
              }
              guidance={
                page.lesson === 5
                  ? "Return to this as ordinary life provides new evidence. Write what you observed, not what you concluded. If a window is still empty, that is information too."
                  : "Evidence, not impression. “Seems kind” is not evidence; what they did, and when, is."
              }
            />
            <MindMarkdown source={linkReferences(dated.after, page.file)} />
          </>
        ) : evidence ? (
          <>
            <MindMarkdown source={linkReferences(evidence.before, page.file)} />
            <h3
              className="mt-8 text-xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              Part B — What I feel and what I know
            </h3>
            <EvidenceTable
              pageSlug={slug}
              part="B"
              columns={["What I feel about them", "What I know about them, with evidence"]}
              saved={evidenceRows}
              guidance="In the second column, every entry needs evidence: something you have actually seen or heard, and when. Keep each entry short — a line, not an account."
            />
            <MindMarkdown source={linkReferences(evidence.after, page.file)} />
          </>
        ) : nextStep ? (
          <>
            <MindMarkdown source={linkReferences(nextStep.before, page.file)} />
            <h2
              className="mt-10 text-2xl text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              Next faithful step
            </h2>
            <NextStepOptions />
            <MindMarkdown source={linkReferences(nextStep.after, page.file)} />
          </>
        ) : (
          <MindMarkdown source={linkReferences(body, page.file)} />
        )}
      </article>

      {/* Silence is the worst failure this page has. If the listings are not
          there, say so — and when the whole file is gone, do not point at
          global directories that are gone with it. */}
      {support && support.missing.length > 0 && (
        <div
          role="alert"
          className="mt-8 rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-5 py-4 text-sm leading-relaxed text-[#8B3A2E]"
        >
          {/* Judged on what the reader can actually see, not on why. If no
              listing rendered, pointing at directories "above" is pointing at
              nothing — whether the file was missing or merely empty of
              sections. */}
          {support.missing.length === 8 ? (
            <>
              <p className="font-medium">
                The list of services by country could not be loaded. This is a
                fault on our side, not an absence of help.
              </p>
              <p className="mt-2">
                If you are in immediate danger, contact the emergency service
                where you are, or go to the safest place available to you. To
                find a service, search for a domestic abuse or crisis helpline
                in your country, or try findahelpline.com, which lists services
                in more than 150 countries. Please tell us at
                info@faithfulpathcommunity.com so we can put it right.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                Some of the listings below could not be loaded.
              </p>
              <p className="mt-2">
                Use the global directories above, or tell us at
                info@faithfulpathcommunity.com. If you are in immediate danger,
                contact the emergency service where you are.
              </p>
            </>
          )}
        </div>
      )}

      {recall && <EarlierAnswers refs={recall} />}

      {isFinalPage && <CompletionRecord complete={courseComplete} />}

      <div className="mt-12 border-t border-[#E5D9C7] pt-8">
        <Link
          href={bysySupportHref()}
          className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Finding Help Where You Live
        </Link>
      </div>
    </main>
  );
}
