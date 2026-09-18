import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  SUPPORT_FILE, findPage, findRoute, getPages, linkReferences, pageSlug,
  positionOnRoute, readPage, readSupportPage,
} from "@/lib/bysy-course";
import { BYSY_BASE, bysySupportHref } from "@/lib/bysy-links";
import { getStoredRoute } from "@/lib/bysy-progress";
import MindMarkdown from "@/components/mind/MindMarkdown";

export const metadata: Metadata = {
  title: "Before You Say Yes | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPages().map((p) => ({ slug: pageSlug(p) }));
}

/**
 * Any of the 35 content pages.
 *
 * No page is locked by a route. A route is a starting point: it decides what
 * position the progress line reports, never what may be opened.
 */
export default async function BysyPage({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
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
      "Support page: sections missing from the shared resources file:",
      support.missing.join(", ")
    );
  }

  const route = findRoute(await getStoredRoute());
  const onRoute = route ? positionOnRoute(route, page.file) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-10 sm:pt-14">
      <Link href={BYSY_BASE} className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        ← Before You Say Yes
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {page.module}
        {/* Position, never a percentage against a target and never a streak.
            A learner off their route sees their place in the whole course. */}
        {onRoute
          ? ` · Page ${onRoute.at} of ${onRoute.of} on your route`
          : ` · Page ${page.n} of ${getPages().length}`}
      </p>

      <article className="mt-2">
        <MindMarkdown source={linkReferences(body, page.file)} />
      </article>

      {support && support.missing.length > 0 && (
        <p
          role="alert"
          className="mt-8 rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-5 py-4 text-sm leading-relaxed text-[#8B3A2E]"
        >
          Some country listings could not be loaded. Use the global directories
          above, or tell us at info@faithfulpathcommunity.com. If you are in
          immediate danger, contact the emergency service where you are.
        </p>
      )}

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
