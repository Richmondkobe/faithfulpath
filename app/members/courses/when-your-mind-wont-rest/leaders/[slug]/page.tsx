import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import { findLeadersPage, getLeadersSection, readPageFile } from "@/lib/mind-course";
import { mindLeadersHref } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";

export const metadata: Metadata = {
  title: "For leaders | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getLeadersSection().pages.map((f) => ({
    slug: f.split("/").pop()!.replace(/\.md$/, ""),
  }));
}

/**
 * One leaders' page. Reading the guidance needs no acknowledgement — only the
 * group downloads do. Someone deciding whether they should lead a group has to
 * be able to read the safeguarding pages first.
 */
export default async function LeadersPage({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const file = findLeadersPage(slug);
  if (!file) notFound();

  const page = readPageFile(file);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
      <Link
        href={mindLeadersHref()}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← Using This Course With Others
      </Link>
      <article className="mt-2">
        <MindMarkdown source={page.body} />
      </article>
    </main>
  );
}
