import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Longform article typography. The block styling deliberately mirrors what the
// articles used before they moved into Supabase, so migrated posts render
// identically — a body with no markdown in it is still just paragraphs.

const DISPLAY = "var(--font-display)";

// Editors often paste a body that opens with the article's own title, which
// would render as a second, larger headline directly under the real one.
function stripDuplicateTitle(source: string, title?: string): string {
  if (!title) return source;

  const normalise = (s: string) =>
    s
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const wanted = normalise(title);
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return source;

  // "# Title", with the optional closing hashes ATX headings allow.
  const atx = lines[i].match(/^#\s+(.*?)\s*#*\s*$/);
  if (atx && normalise(atx[1]) === wanted) {
    return lines.slice(i + 1).join("\n");
  }

  // The setext form: the title underlined with "=".
  const next = lines[i + 1];
  if (next !== undefined && /^=+\s*$/.test(next) && normalise(lines[i]) === wanted) {
    return lines.slice(i + 2).join("\n");
  }

  return source;
}

const components: Components = {
  h1: ({ children }) => (
    <h2
      className="pt-6 text-2xl leading-snug text-[#2B2118] sm:text-3xl"
      style={{ fontFamily: DISPLAY, fontWeight: 400 }}
    >
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2
      className="pt-6 text-2xl leading-snug text-[#2B2118] sm:text-3xl"
      style={{ fontFamily: DISPLAY, fontWeight: 400 }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="pt-4 text-xl text-[#2B2118]"
      style={{ fontFamily: DISPLAY, fontWeight: 500 }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      className="pt-2 text-lg text-[#2B2118]"
      style={{ fontFamily: DISPLAY, fontWeight: 500 }}
    >
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p
      className="text-lg leading-relaxed"
      style={{ fontFamily: DISPLAY, fontWeight: 300 }}
    >
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-[#2B2118]">{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  // Same tab: these are mostly internal links and scripture references, and a
  // new window is a worse reading experience than the back button.
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-2 pl-6 text-lg leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-2 border-[#8B5E34] pl-6 text-lg leading-relaxed text-[#5C5147] italic"
      style={{ fontFamily: DISPLAY, fontWeight: 300 }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-t border-[#E5D9C7]" />,
  code: ({ children }) => (
    <code className="rounded-sm bg-[#F3EBDD] px-1.5 py-0.5 text-[0.9em] text-[#2B2118]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-sm bg-[#F3EBDD] p-4 text-sm text-[#2B2118]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-base">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-[#E5D9C7] py-2 pr-4 font-medium text-[#2B2118]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[#E5D9C7] py-2 pr-4 align-top">{children}</td>
  ),
};

export default function ArticleBody({
  source,
  title,
}: {
  source: string;
  title?: string;
}) {
  return (
    <div className="mt-10 space-y-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {stripDuplicateTitle(source, title)}
      </ReactMarkdown>
    </div>
  );
}
