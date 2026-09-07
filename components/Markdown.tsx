import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Guide subtitles and descriptions. Article bodies use components/ArticleBody.tsx,
// which is the same react-markdown setup kept at the longform article scale.

const DISPLAY = "var(--font-display)";

// The subtitle sits directly under the guide title and is set larger and
// lighter than the description below it.
const LEDE_P = {
  className: "text-lg leading-relaxed",
  style: { fontFamily: DISPLAY, fontWeight: 300 },
};
const BODY_P = { className: "leading-relaxed", style: undefined };

function buildComponents(lede: boolean): Components {
  const p = lede ? LEDE_P : BODY_P;

  return {
    p: ({ children }) => (
      <p className={p.className} style={p.style}>
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2
        className="pt-4 text-2xl text-[#2B2118]"
        style={{ fontFamily: DISPLAY, fontWeight: 500 }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className="pt-3 text-xl text-[#2B2118]"
        style={{ fontFamily: DISPLAY, fontWeight: 500 }}
      >
        {children}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="font-medium text-[#2B2118]">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    // Same tab, matching the guide page's accent.
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="ml-5 list-disc space-y-2 leading-relaxed">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="ml-5 list-decimal space-y-2 leading-relaxed">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[#8B5E34] pl-5 leading-relaxed text-[#5C5147] italic">
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
        <table className="w-full border-collapse text-left">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-[#E5D9C7] py-2 pr-4 font-medium text-[#2B2118]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[#E5D9C7] py-2 pr-4 align-top">
        {children}
      </td>
    ),
  };
}

const LEDE_COMPONENTS = buildComponents(true);
const BODY_COMPONENTS = buildComponents(false);

export default function Markdown({
  source,
  lede = false,
}: {
  source: string;
  lede?: boolean;
}) {
  return (
    <div className={lede ? "space-y-3" : "space-y-5"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={lede ? LEDE_COMPONENTS : BODY_COMPONENTS}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
