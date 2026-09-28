import Link from "next/link";
import type { ReactNode } from "react";

import { LBYR_BASE, lbyrConcernsHref } from "@/lib/lbyr-links";
import { Inlines } from "@/components/lbyr/Blocks";
import type { Inline } from "@/lib/lbyr-html";

/** A beige panel. Used only where the preview pages use one. */
export function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-6 py-7">
      {children}
    </section>
  );
}

/** A plain section, no panel. */
export function Plain({ children }: { children: ReactNode }) {
  return <section className="px-1 py-2">{children}</section>;
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-[1.6rem] leading-tight text-[#2B2118]"
      style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
    >
      {children}
    </h2>
  );
}

/**
 * The page frame: the course rule above, the content, and the footer the
 * preview pages carry — the two nav links, then the ESV and copyright notice.
 */
export default function LbyrShell({
  eyebrow,
  children,
  notice,
}: {
  eyebrow?: ReactNode;
  children: ReactNode;
  notice: Inline[];
}) {
  return (
    <>
      <main
        className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-8 pb-14 text-[18px] text-[#4A4038]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {eyebrow}
        {children}
      </main>

      <footer className="mx-auto max-w-[760px] px-4 pb-14">
        <div className="border-t border-[#E5D9C7] pt-5 text-[13px] leading-relaxed text-[#6B5F53]">
          <nav
            aria-label="Course"
            className="flex flex-wrap items-center gap-x-5 gap-y-1"
          >
            <Link
              href={`${LBYR_BASE}#help`}
              className="flex min-h-11 items-center text-[#8B5E34] underline underline-offset-4"
            >
              Need help with your next step?
            </Link>
            <Link
              href={lbyrConcernsHref}
              className="flex min-h-11 items-center text-[#8B5E34] underline underline-offset-4"
            >
              Concerns, Care and Reporting
            </Link>
          </nav>
          <p className="mt-2">
            <Inlines nodes={notice} />
          </p>
        </div>
      </footer>
    </>
  );
}
