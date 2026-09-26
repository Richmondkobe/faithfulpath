import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import {
  getTbymCourse,
  readTbymStartHere,
  tbymLessonHref,
  tbymSafetyHref,
  TBYM_BASE,
} from "@/lib/tbym-course";
import TbymMarkdown from "@/components/tbym/TbymMarkdown";
import TbymAcknowledgement from "@/components/tbym/TbymAcknowledgement";
import TbymFooter from "@/components/tbym/TbymFooter";

export const metadata: Metadata = {
  title: "Talk Before You Marry | Faithful Path Community",
  robots: { index: false, follow: false },
};

/** Sections whose prose names something that does not exist on the site yet. */
const UNBUILT: Record<string, string> = {
  "Who it is for": "Facilitator guide — page not built yet",
};

/** Sections whose prose names a page that does exist, linked at its foot. */
const LINKED: Record<string, { label: string; href: string }> = {
  "Safety and support": {
    label: "Visit Safety and Support",
    href: tbymSafetyHref,
  },
};

export default async function TbymStartHere() {
  await requireActiveMember();

  const course = getTbymCourse();
  const page = readTbymStartHere();
  const firstLesson = course.lessons.find((l) => l.order === 1);

  return (
    <>
      <main
        className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-8 pb-14"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <div
          className="flex flex-col gap-1 text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          style={{ fontFamily: "var(--font-tbym-mono)" }}
        >
          <Link href={TBYM_BASE} className="underline underline-offset-4">
            {course.title}
          </Link>
          <span>{page.readingTime}</span>
        </div>

        <section className="rounded-md border border-[var(--tb-line)] bg-[var(--tb-card)] px-6 py-7">
          <h1
            className="text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[var(--tb-ink)]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            {page.title}
          </h1>
          <p
            className="mt-2 text-[1.3rem] leading-snug text-[var(--tb-mute)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.subtitle}
          </p>
        </section>

        <section className="rounded-md border border-transparent px-6 py-7">
          <blockquote
            className="text-[1.3rem] leading-[1.5] text-[var(--tb-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            &ldquo;{page.scriptureText}&rdquo;
          </blockquote>
          <p
            className="mt-3 text-[13px] uppercase tracking-[0.1em] text-[var(--tb-accent)]"
            style={{ fontFamily: "var(--font-tbym-mono)", fontWeight: 500 }}
          >
            {page.scriptureRef}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--tb-mute)]">
            {page.scriptureNote}
          </p>
        </section>

        {/* Rendered in the order the file writes them, so a section added to
            the content appears here without a code change. */}
        {page.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-md border border-[var(--tb-line)] bg-[var(--tb-card)] px-6 py-7"
          >
            <h2
              className="mb-3 text-[1.6rem] leading-tight text-[var(--tb-ink)]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {section.title}
            </h2>
            <div className="text-[var(--tb-ink)]">
              <TbymMarkdown source={section.body} />
            </div>

            {UNBUILT[section.title] && (
              <p className="mt-4">
                <span
                  className="inline-block rounded-sm border border-dashed border-[var(--tb-accent)] px-3 py-2 text-[13px] text-[var(--tb-mute)]"
                  style={{ fontFamily: "var(--font-tbym-mono)" }}
                >
                  {UNBUILT[section.title]}
                </span>
              </p>
            )}

            {LINKED[section.title] && (
              <p className="mt-4">
                <Link
                  href={LINKED[section.title].href}
                  className="text-[15px] text-[var(--tb-accent)] underline underline-offset-4"
                >
                  {LINKED[section.title].label}
                </Link>
              </p>
            )}

            {/* The tick, and the way into Lesson 1 behind it, belong to the
                last section rather than standing apart from its words. */}
            {section.title === "Ready to begin?" && firstLesson && (
              <div className="mt-5">
                <TbymAcknowledgement
                  acknowledgement={page.acknowledgement}
                  beginLabel={page.beginLabel}
                  beginHref={tbymLessonHref(firstLesson.slug)}
                  stopHref="/members"
                  safetyHref={tbymSafetyHref}
                />
              </div>
            )}
          </section>
        ))}
      </main>

      <TbymFooter variant="full" />
    </>
  );
}
