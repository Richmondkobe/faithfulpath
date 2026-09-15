import Link from "next/link";
import { getMindCourse } from "@/lib/mind-course";
import { mindLessonHref, slugFromFile } from "@/lib/mind-links";

/**
 * Chrome every page of this course carries: the two persistent support links,
 * and the ESV notice.
 *
 * The manifest requires both on every page — footer_links, and
 * scripture.notice_required_on — so they live in the layout rather than being
 * repeated on each route, where one page would eventually be missed.
 *
 * Gating is deliberately not done here. Every page and action re-checks the
 * membership for itself, because a layout is not a guard: a Server Action posts
 * straight to its own route without one ever rendering.
 */
export default function MindCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const course = getMindCourse();

  return (
    <>
      {children}

      <footer className="mx-auto max-w-3xl px-6 pb-20">
        <div className="border-t border-[#E5D9C7] pt-8">
          <nav aria-label="Support" className="flex flex-wrap gap-x-6 gap-y-2">
            {course.footer_links.map((link) => (
              <Link
                key={link.opens}
                href={mindLessonHref(slugFromFile(link.opens))}
                className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="mt-6 text-[11px] leading-relaxed text-[#8A7F73]">
            {course.scripture.notice}
          </p>
        </div>
      </footer>
    </>
  );
}
