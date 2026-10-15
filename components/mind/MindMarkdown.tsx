import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";

// The course's prose, at the scale the lessons are written in.
//
// Unlike components/Markdown.tsx this gives every heading an id. The complete
// chapter is rendered inside one disclosure, and its H3s and H4s have to stay
// visible and anchored in there — a reader following "see the section on
// rumination" needs somewhere to land.

const DISPLAY = "var(--font-display)";

/** A stable anchor from the heading's own words. */
function headingId(children: ReactNode): string {
  const text = extractText(children);
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "section"
  );
}

function extractText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

const components: Components = {
  p: ({ children }) => <p className="mt-4 leading-relaxed">{children}</p>,
  h1: ({ children }) => (
    <h1
      id={headingId(children)}
      className="mt-10 scroll-mt-24 text-[2rem] leading-[1.15] text-navy"
      style={{ fontFamily: DISPLAY, fontWeight: 400 }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      id={headingId(children)}
      className="mt-10 scroll-mt-24 text-2xl text-navy"
      style={{ fontFamily: DISPLAY, fontWeight: 500 }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={headingId(children)}
      className="mt-8 scroll-mt-24 text-xl text-navy"
      style={{ fontFamily: DISPLAY, fontWeight: 500 }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      id={headingId(children)}
      className="mt-6 scroll-mt-24 text-lg text-navy"
      style={{ fontFamily: DISPLAY, fontWeight: 500 }}
    >
      {children}
    </h4>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-navy">{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 ml-5 list-disc space-y-2 leading-relaxed">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 ml-5 list-decimal space-y-2 leading-relaxed">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className="mt-6 border-l-2 border-gold-text pl-5 text-lg leading-relaxed text-navy"
      style={{ fontFamily: DISPLAY, fontWeight: 400 }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="mt-10 border-line" />,
  // Wide tables scroll inside their own box rather than pushing the page.
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-field px-3 py-2 text-left font-medium text-navy">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line px-3 py-2 align-top">{children}</td>
  ),
};

export default function MindMarkdown({
  source,
  tight = false,
  extra,
}: {
  source: string;
  /** Drops the leading margin, for prose inside a box that sets its own. */
  tight?: boolean;
  /**
   * Renderers layered over the defaults, for a course that needs one element
   * to behave differently — Before You Say Yes turns its "Leave this page"
   * links into the quick exit.
   */
  extra?: Components;
}) {
  return (
    <div className={tight ? "[&>*:first-child]:mt-0" : undefined}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...components, ...extra }}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
