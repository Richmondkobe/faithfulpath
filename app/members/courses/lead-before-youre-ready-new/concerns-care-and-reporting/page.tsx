import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import ConcernsCareAndReporting from "@/components/lbyr/ConcernsCareAndReporting";
import { LBYR_WELCOME_PATH, requireLbyrNewOpen } from "@/lib/lbyr-new";
import { HELP_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Concerns, Care and Reporting | Lead Before You’re Ready",
  robots: { index: false, follow: false },
};

/**
 * Concerns, Care and Reporting for the new edition: the September edition's
 * page, word for word, open to anyone (Richmond, 16 October 2026), since the
 * public Welcome page links to it and a concern should never wait for a
 * sign-in.
 */
export default async function LbyrNewConcerns() {
  // Decided at each visit, not at build time, like every other page of the
  // course: whether it is open depends on where it runs (lib/lbyr-new.ts).
  await connection();
  requireLbyrNewOpen();

  return (
    <>
      <main
        className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pt-8 pb-14 text-[18px] text-ink"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <ConcernsCareAndReporting />
      </main>
      <footer className="mx-auto max-w-[760px] px-4 pb-14">
        <nav
          aria-label="Course"
          className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-5 text-[13px] text-muted"
        >
          {/* A whole HTML page, not a React one, so a plain link rather than <Link>. */}
          <a href={LBYR_WELCOME_PATH} className="flex min-h-11 items-center text-gold-text underline underline-offset-4">
            Lead Before You’re Ready
          </a>
          <Link href={HELP_PATH} className="flex min-h-11 items-center text-gold-text underline underline-offset-4">
            Find help where you live
          </Link>
        </nav>
      </footer>
    </>
  );
}
