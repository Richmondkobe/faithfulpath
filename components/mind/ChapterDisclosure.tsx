import MindMarkdown from "@/components/mind/MindMarkdown";

/**
 * The complete chapter, in one collapsed disclosure.
 *
 * The source Markdown carries no raw HTML — react-markdown does not render it —
 * so the disclosure is built here at render time from the section
 * lib/mind-course.ts split out. There is exactly one `details`: the chapter's
 * own H3s and H4s stay as headings inside it, visible and anchored once opened,
 * and are never turned into disclosures of their own.
 *
 * `details` is the native element on purpose. It opens without JavaScript, the
 * browser's own find-in-page can reach into it on current browsers, and on a
 * phone it behaves the way every other expandable section does.
 */
export default function ChapterDisclosure({
  chapter,
  lessonTitle,
}: {
  chapter: string;
  lessonTitle: string;
}) {
  return (
    <details className="group mt-12 border-t border-[#E5D9C7] pt-8">
      <summary className="cursor-pointer list-none">
        <span
          className="inline-flex items-center gap-2 text-xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          <span
            aria-hidden="true"
            className="text-[#8B5E34] transition-transform group-open:rotate-90"
          >
            ›
          </span>
          Read the complete chapter
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-[#6B5F53]">
          The full teaching from {lessonTitle}. The lesson above is the shorter
          version — you do not need both.
        </span>
      </summary>

      <div className="mt-2 border-t border-[#E5D9C7] pt-2">
        <MindMarkdown source={chapter} />
      </div>
    </details>
  );
}
