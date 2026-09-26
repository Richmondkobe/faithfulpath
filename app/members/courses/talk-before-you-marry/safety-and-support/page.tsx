import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import {
  TBYM_BASE,
  readTbymSafety,
  requireTbymPublished,
  tbymSafetyHref,
  tbymStartHereHref,
} from "@/lib/tbym-course";
import TbymMarkdown from "@/components/tbym/TbymMarkdown";
import TbymQuickExit from "@/components/tbym/TbymQuickExit";
import TbymFooter from "@/components/tbym/TbymFooter";

export const metadata: Metadata = {
  title: "Safety and Support | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * Safety and Support.
 *
 * Every lesson's "Need more support?" block points here, which is the whole
 * design: telephone numbers and service names change, so they live on one page
 * that can be corrected without touching fourteen lessons or re-recording
 * anything.
 *
 * The quick exit is the first thing on the page, above the title, because
 * somebody who needs it needs it immediately.
 */
export default async function TbymSafetyAndSupport() {
  await requireActiveMember();
  requireTbymPublished();

  const page = readTbymSafety();

  return (
    <>
      <main
        className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-8 pb-14"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <TbymQuickExit label={page.quickExitLabel} note={page.quickExitNote} />

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
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--tb-ink)]">
            {page.intro}
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
            Return to your lessons
          </Link>
        </p>
      </main>

      {/* The fuller footer, without a link back to this page: the learner is
          already reading it. */}
      <TbymFooter variant="full" omit={tbymSafetyHref} />
    </>
  );
}
