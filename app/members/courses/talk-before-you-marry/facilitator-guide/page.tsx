import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import {
  TBYM_BASE,
  readTbymFacilitatorGuide,
  requireTbymPublished,
  tbymSafetyHref,
  tbymStartHereHref,
} from "@/lib/tbym-course";
import TbymMarkdown from "@/components/tbym/TbymMarkdown";
import TbymFooter from "@/components/tbym/TbymFooter";

export const metadata: Metadata = {
  title: "Facilitator Guide | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The Facilitator Guide.
 *
 * Read by a pastor or mentor rather than by the couple, which is why it opens
 * by saying so. It is the one page of this course that talks about the learners
 * instead of to them, and its firmest instruction is the one it shares with
 * every lesson: where there is fear, do not arrange a joint conversation.
 *
 * Two sections name the Safety and Support page, so both link to it.
 */
const LINKED: Record<string, true> = {
  "Before you begin: meet each person alone": true,
  "When to bring in someone else": true,
};

export default async function TbymFacilitatorGuide() {
  await requireActiveMember();
  requireTbymPublished();

  const page = readTbymFacilitatorGuide();

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
            Talk Before You Marry
          </Link>
          <span>For facilitators</span>
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

            {LINKED[section.title] && (
              <p className="mt-4">
                <Link
                  href={tbymSafetyHref}
                  className="text-[15px] text-[var(--tb-accent)] underline underline-offset-4"
                >
                  Visit Safety and Support
                </Link>
              </p>
            )}
          </section>
        ))}

        <p className="flex flex-wrap gap-x-5 gap-y-2 px-6 text-[15px]">
          <Link
            href={tbymStartHereHref}
            className="text-[var(--tb-accent)] underline underline-offset-4"
          >
            Return to Start Here
          </Link>
          <Link
            href={TBYM_BASE}
            className="text-[var(--tb-accent)] underline underline-offset-4"
          >
            Return to the course
          </Link>
        </p>
      </main>

      <TbymFooter variant="full" />
    </>
  );
}
