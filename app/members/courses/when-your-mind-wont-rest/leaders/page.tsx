import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import { getLeadersSection, readPageFile } from "@/lib/mind-course";
import { getPageAnswers, readJson, LEADERS_ACK_INDEX } from "@/lib/mind-progress";
import { MIND_BASE, mindLeadersHref } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";
import LeadersGate from "@/components/mind/LeadersGate";

export const metadata: Metadata = {
  title: "Using This Course With Others | Faithful Path Community",
  robots: { index: false, follow: false },
};

export type LeadersAck = {
  read_safety_and_safeguarding?: boolean;
  at?: string | null;
};

/**
 * The leaders' gate, reached from the course home and outside the learner
 * pathway. Member-gated like everything else here; the acknowledgement on it
 * gates only the three group downloads.
 */
export default async function LeadersHome() {
  await requireActiveMember();

  const section = getLeadersSection();
  const file = readPageFile(section.gate);
  if (!file) notFound();

  const block = file.front.acknowledgement as
    | { statements?: { id: string; text: string }[] }
    | undefined;
  const statement = block?.statements?.[0]?.text ?? "";

  const answers = await getPageAnswers("leaders");
  const ack = readJson<LeadersAck>(answers, LEADERS_ACK_INDEX);
  const checked = ack?.read_safety_and_safeguarding === true;

  const downloads = section.downloads.map((f) => {
    const slug = f.split("/").pop()!.replace(/\.(md|pdf)$/, "");
    return {
      slug,
      label: slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/Pdf$/, ""),
      href: `${mindLeadersHref()}/downloads/${slug}`,
    };
  });

  const pages = section.pages
    .map((f) => f.split("/").pop()!.replace(/\.md$/, ""))
    .filter((slug) => slug !== section.gate.split("/").pop()!.replace(/\.md$/, ""));

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
      <Link href={MIND_BASE} className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        ← When Your Mind Won&rsquo;t Rest
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        For leaders · not part of the learner pathway
      </p>

      <article className="mt-2">
        <MindMarkdown source={file.body} />
      </article>

      <LeadersGate
        statement={statement}
        downloads={downloads}
        checked={checked}
        acknowledgedAt={ack?.at ?? null}
      />

      <nav className="mt-12 border-t border-[#E5D9C7] pt-8">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          The leaders&rsquo; guidance
        </h2>
        <ul className="mt-4 space-y-2">
          {pages.map((slug) => (
            <li key={slug}>
              <Link
                href={mindLeadersHref(slug)}
                className="text-[15px] text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                {slug.replace(/^\d+-/, "").replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
