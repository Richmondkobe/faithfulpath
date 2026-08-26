import { Fragment, type ReactNode } from "react";

// A deliberately small markdown renderer for guide descriptions: headings,
// paragraphs, bullet lists, bold and italic. No raw HTML is ever rendered, so
// there is nothing to sanitise.

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-[#2B2118]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);

  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        const lines = block.split("\n");

        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="ml-5 list-disc space-y-2 leading-relaxed">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        const heading = block.match(/^(#{2,3})\s+(.*)$/);
        if (heading) {
          const Tag = heading[1].length === 2 ? "h2" : "h3";
          return (
            <Tag
              key={i}
              className={
                heading[1].length === 2
                  ? "pt-4 text-2xl text-[#2B2118]"
                  : "pt-3 text-xl text-[#2B2118]"
              }
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              {inline(heading[2])}
            </Tag>
          );
        }

        return (
          <p key={i} className="leading-relaxed">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}
