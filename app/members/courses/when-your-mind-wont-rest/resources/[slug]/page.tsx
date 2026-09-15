import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findResourceBySlug,
  getMindCourse,
  hasSafetyBoxBeforePrompts,
  readPageFile,
  resourceSlug,
} from "@/lib/mind-course";
import { MIND_BASE } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";

export const metadata: Metadata = {
  title: "Worksheet | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getMindCourse().resources.map((r) => ({ slug: resourceSlug(r) }));
}

/**
 * A printable worksheet.
 *
 * Members fill these in on paper, so the page is plain and the print rules drop
 * everything that is not the document. Nothing here is ever counted, chased or
 * marked incomplete: the manifest sets never_prompt_repeat and
 * counts_towards_completion: false on every one of them, and there is
 * deliberately no "you have not finished this" anywhere on the page.
 */
export default async function MindResource({ params }: Props) {
  await requireActiveMember();

  const { slug } = await params;
  const resource = findResourceBySlug(slug);
  if (!resource) notFound();

  const file = readPageFile(resource.file);
  if (!file) notFound();

  // Some exercises must never appear without their safety box. The flag says
  // the box should be there; this checks that it is, and withholds the exercise
  // rather than showing prompts that were written to be read after a warning.
  const safetyOk =
    !resource.safety_box_required_before_prompts ||
    hasSafetyBoxBeforePrompts(file.body);

  const notice = getMindCourse().scripture.notice;

  return (
    <main className="resource-sheet mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          .resource-sheet { max-width: none; padding: 0; }
          a { text-decoration: none; color: inherit; }
          body { background: #fff; }
          /* The private marking and the notice are part of the document. */
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="no-print">
        <Link
          href={MIND_BASE}
          className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
        >
          ← When Your Mind Won&rsquo;t Rest
        </Link>
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Worksheet {resource.toolkit_number}
      </p>

      {/* On screen and on paper both: someone printing this to take to a group
          has to be able to see that this one is not for the group. */}
      {resource.not_for_group_sharing && (
        <p className="mt-3 rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]">
          <strong className="font-medium">Private — not for group sharing.</strong>{" "}
          {resource.group_sharing_note ??
            "This worksheet is yours alone. Do not read it aloud or hand it round in a group."}
        </p>
      )}

      {safetyOk ? (
        <article className="mt-2">
          <MindMarkdown source={file.body} />
        </article>
      ) : (
        <div className="mt-8 rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-5 py-5">
          <p className="text-[#8B3A2E]">This worksheet is not available.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#8B3A2E]">
            It is meant to be read alongside a safety note that is missing from
            this page, and the exercise should not be attempted without it.
            Please tell us at info@faithfulpathcommunity.com.
          </p>
        </div>
      )}

      <p className="no-print mt-10 text-sm leading-relaxed text-[#6B5F53]">
        Optional, and yours alone. Print this page from your browser (File →
        Print) to fill it in by hand. Nothing here counts towards finishing the
        course, and you will never be asked to do it again.
      </p>

      {/* Required on every downloadable and printable page, not just on screen. */}
      <p className="print-only mt-10 text-[10px] leading-relaxed text-[#6B5F53]">
        {notice}
      </p>
    </main>
  );
}
