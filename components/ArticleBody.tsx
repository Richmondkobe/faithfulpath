import { Fragment } from "react";
import { parseInline, parseMarkdown } from "@/lib/markdown";

// Longform article typography. Deliberately mirrors the block styling the
// articles used before they moved into Supabase, so migrated posts render
// identically.

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((span, i) => {
        if (span.bold) {
          return (
            <strong key={i} className="font-medium text-[#2B2118]">
              {span.text}
            </strong>
          );
        }
        if (span.italic) return <em key={i}>{span.text}</em>;
        return <Fragment key={i}>{span.text}</Fragment>;
      })}
    </>
  );
}

export default function ArticleBody({ source }: { source: string }) {
  return (
    <div className="mt-10 space-y-6">
      {parseMarkdown(source).map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="pt-6 text-2xl leading-snug text-[#2B2118] sm:text-3xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                <Inline text={block.text} />
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="pt-4 text-xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                <Inline text={block.text} />
              </h3>
            );
          case "list":
            return (
              <ul
                key={i}
                className="list-disc space-y-2 pl-6 text-lg leading-relaxed"
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p
                key={i}
                className="text-lg leading-relaxed"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
              >
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
