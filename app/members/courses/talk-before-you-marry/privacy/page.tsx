import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import {
  TBYM_BASE,
  readTbymProsePage,
  requireTbymPublished,
  tbymPrivacyHref,
} from "@/lib/tbym-course";
import TbymMarkdown from "@/components/tbym/TbymMarkdown";
import TbymFooter from "@/components/tbym/TbymFooter";

export const metadata: Metadata = {
  title: "Privacy | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * Privacy, for this course.
 *
 * Scoped to the course rather than the whole site, because everything it says
 * is about what this course does — and saying it site-wide would be claiming
 * more than anyone has checked.
 */
export default async function TbymPrivacy() {
  await requireActiveMember();
  requireTbymPublished();

  const page = readTbymProsePage("privacy.md");

  return (
    <>
      <main
        className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-8 pb-14"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <div
          className="text-[12px] uppercase tracking-[0.16em] text-[var(--tb-accent)]"
          style={{ fontFamily: "var(--font-tbym-mono)" }}
        >
          <Link href={TBYM_BASE} className="underline underline-offset-4">
            Talk Before You Marry
          </Link>
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
          </section>
        ))}
      </main>

      {/* The fuller footer, without a link back to the page you are reading. */}
      <TbymFooter variant="full" omit={tbymPrivacyHref} />
    </>
  );
}
