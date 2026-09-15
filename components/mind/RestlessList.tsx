import Link from "next/link";
import { findResource, resourceSlug } from "@/lib/mind-course";
import { mindLessonHref, mindResourceHref } from "@/lib/mind-links";

export type RestlessEntry = {
  text: string;
  lesson?: number;
  lesson_title?: string;
  resource?: string;
  resource_label?: string;
  /** The night-time entry routes to a page and offers no exercise. */
  page?: string;
};

/**
 * "My Mind Is Restless Right Now".
 *
 * The visible list is generated from the page's `entries` front matter so the
 * routes are defined once; the Markdown list in the body is a fallback, and
 * npm run verify:mind holds the two to each other.
 *
 * This page is never locked by lesson order or by Module 0 — someone reaching
 * for it is not in a position to work through an orientation module first.
 */
export default function RestlessList({
  entries,
  lessonSlugByNumber,
}: {
  entries: RestlessEntry[];
  /** Lesson number to route slug, resolved from the manifest by the page. */
  lessonSlugByNumber: Record<number, string>;
}) {
  return (
    <ul className="mt-8 space-y-3">
      {entries.map((entry) => {
        // The night-time entry deliberately leads to one page and to no
        // exercise. Keep it that way.
        if (entry.page) {
          return (
            <li key={entry.text}>
              <Link
                href={mindLessonHref(entry.page)}
                className="group block rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 transition-colors hover:border-[#8B5E34]"
              >
                <span className="block text-[#2B2118] transition-colors group-hover:text-[#8B5E34]">
                  {entry.text}
                </span>
              </Link>
            </li>
          );
        }

        const lessonSlug = entry.lesson ? lessonSlugByNumber[entry.lesson] : undefined;
        const resource = entry.resource ? findResource(entry.resource) : null;

        return (
          <li
            key={entry.text}
            className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4"
          >
            <p className="text-[#2B2118]">{entry.text}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {lessonSlug && (
                <Link
                  href={mindLessonHref(lessonSlug)}
                  className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  Lesson {entry.lesson}
                  {entry.lesson_title ? `: ${entry.lesson_title}` : ""}
                </Link>
              )}
              {resource && (
                <Link
                  href={mindResourceHref(resourceSlug(resource))}
                  className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  {entry.resource_label ?? resource.title}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
