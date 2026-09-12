import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import { requireActiveMember } from "@/lib/member-gate";
import { getCourse, getResource } from "@/lib/course";
import { ESV_NOTICE } from "@/components/course/CourseFooter";

export const metadata: Metadata = {
  title: "Resource | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * A printable worksheet. The member fills these in on paper, so the page is
 * plain and the print rules below drop everything that is not the document —
 * the site chrome, the links, the backgrounds.
 */
export default async function ResourcePage({
  params,
}: {
  params: Promise<{ courseSlug: string; resourceSlug: string }>;
}) {
  await requireActiveMember();

  const { courseSlug, resourceSlug } = await params;
  const course = getCourse(courseSlug);
  const resource = getResource(courseSlug, resourceSlug);
  if (!course || !resource) notFound();

  return (
    <main className="resource-sheet mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          .resource-sheet { max-width: none; padding: 0; }
          a { text-decoration: none; color: inherit; }
          body { background: #fff; }
        }
      `}</style>

      <div className="no-print">
        <Link
          href={`/members/courses/${courseSlug}`}
          className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
        >
          ← {course.title}
        </Link>
      </div>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[2.75rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {resource.title}
      </h1>

      <p className="no-print mt-4 text-sm text-[#6B5F53]">
        Print this page from your browser (File → Print) to fill it in by hand.
      </p>

      <ArticleBody source={resource.body} title={resource.title} />

      <p className="mt-16 border-t border-[#E5D9C7] pt-6 text-xs leading-relaxed text-[#6B5F53]">
        {ESV_NOTICE}
      </p>
    </main>
  );
}
