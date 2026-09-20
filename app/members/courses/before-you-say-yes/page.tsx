import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import { getPages, linkHomeCalls, linkReferences, readCourseHome } from "@/lib/bysy-course";
import MindMarkdown from "@/components/mind/MindMarkdown";
import { BYSY_SIMPLE_PUBLISHED } from "@/lib/bysy-simple-links";
import { SIMPLE_PAGES } from "@/lib/bysy-simple";

export const metadata: Metadata = {
  title: "Before You Say Yes | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The course home.
 *
 * It is not one of the 35 content pages and carries no position in the
 * progress display — the build notes are explicit that the home is not page 1
 * of 36.
 */
export default async function BysyHome() {
  await requireActiveMember();

  const body = readCourseHome();
  if (!body) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 pt-10 sm:pt-14">
      <Link href="/members" className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        ← Members
      </Link>

      {/* One switch decides which layer a learner lands in, and which home
          describes it. The detailed pages stay where they are either way — as
          the book chapter each simple lesson links to. */}
      <article className="mt-2">
        <MindMarkdown source={linkHomeCalls(linkReferences(body))} />
      </article>

      <p className="mt-12 border-t border-[#E5D9C7] pt-8 text-sm text-[#6B5F53]">
        {BYSY_SIMPLE_PUBLISHED ? SIMPLE_PAGES.length : getPages().length} pages,
        at your own pace. Nothing is locked and nothing is timed.
      </p>
    </main>
  );
}
