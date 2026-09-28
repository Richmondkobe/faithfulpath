import Link from "next/link";
import type { ReactNode } from "react";

import type { Block, Inline } from "@/lib/lbyr-html";
import { lbyrConcernsHref } from "@/lib/lbyr-links";

/**
 * Renders the parsed preview-page content.
 *
 * The source pages carry a handful of meaningful classes — scripture, note,
 * opt, safety, prompts — and each keeps the presentation it had. Everything
 * else is ordinary prose at the course's 18px body size.
 *
 * Links in the source are placeholders (href="#"), because the previews were
 * not wired to anything. The one that recurs is "Concerns, Care and
 * Reporting", which is resolved by its text to the real page; any other dead
 * link renders as plain text rather than as a link to nowhere.
 */
function inline(nodes: Inline[], key = 0): ReactNode {
  return nodes.map((n, i) => {
    const k = `${key}-${i}`;
    if (n.t === "text") return <span key={k}>{n.v}</span>;
    if (n.t === "em") return <em key={k}>{inline(n.c, i)}</em>;
    if (n.t === "strong")
      return (
        <strong key={k} className="font-medium text-[#2B2118]">
          {inline(n.c, i)}
        </strong>
      );
    if (n.t === "small")
      return (
        <small key={k} className="text-[0.75em] font-normal text-[#6B5F53]">
          {inline(n.c, i)}
        </small>
      );

    const label = n.c.map((c) => (c.t === "text" ? c.v : "")).join("");
    if (/Concerns, Care and Reporting/i.test(label)) {
      return (
        <Link
          key={k}
          href={lbyrConcernsHref}
          className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          {inline(n.c, i)}
        </Link>
      );
    }
    if (n.href && n.href !== "#") {
      return (
        <a
          key={k}
          href={n.href}
          className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          {inline(n.c, i)}
        </a>
      );
    }
    return <span key={k}>{inline(n.c, i)}</span>;
  });
}

export function Inlines({ nodes }: { nodes: Inline[] }) {
  return <>{inline(nodes)}</>;
}

const P_CLASS: Record<string, string> = {
  scripture:
    "text-[19px] leading-relaxed text-[#2B2118] [font-family:var(--font-display)]",
  note: "text-[15px] leading-relaxed text-[#6B5F53]",
  opt: "mt-5 rounded-sm border border-[#E5D9C7] bg-[#FDFAF4] px-4 py-3 text-[16px] leading-relaxed text-[#4A4038]",
  safety:
    "mt-5 rounded-sm border-l-[3px] border-[#8B5E34] bg-[#F3EADC] px-4 py-3 text-[16px] leading-relaxed text-[#2B2118]",
  sub: "text-[19px] leading-snug text-[#6B5F53]",
  done: "text-[19px] leading-snug text-[#2B2118] [font-family:var(--font-display)]",
};

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return (
              <p
                key={i}
                className={`${i > 0 ? "mt-4" : ""} ${
                  b.cls ? P_CLASS[b.cls] ?? "text-[18px] leading-relaxed" : "text-[18px] leading-relaxed"
                }`}
              >
                <Inlines nodes={b.c} />
              </p>
            );
          case "h":
            if (b.level === 3)
              return (
                <h3
                  key={i}
                  className="mt-7 text-[19px] leading-snug text-[#2B2118]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  <Inlines nodes={b.c} />
                </h3>
              );
            return (
              <h2
                key={i}
                className="mt-8 text-[1.6rem] leading-tight text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                <Inlines nodes={b.c} />
              </h2>
            );
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={`mt-4 space-y-2 pl-6 text-[18px] leading-relaxed ${
                  b.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Blocks blocks={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "term":
            return (
              <div key={i} className="mt-5">
                <p className="text-[18px] font-medium leading-snug text-[#2B2118]">
                  <Inlines nodes={b.term} />
                </p>
                <div className="mt-1 text-[17px] leading-relaxed text-[#4A4038]">
                  <Blocks blocks={b.body} />
                </div>
              </div>
            );
          case "dl":
            return (
              <dl key={i} className="mt-5 space-y-4">
                {b.items.map((item, j) => (
                  <div key={j} className="rounded-sm border border-[#E5D9C7] px-4 py-3">
                    <dt className="text-[17px] font-medium text-[#2B2118]">
                      <Inlines nodes={item.term} />
                    </dt>
                    <dd className="mt-1 text-[17px] leading-relaxed">
                      <Blocks blocks={item.desc} />
                    </dd>
                  </div>
                ))}
              </dl>
            );
          case "table":
            return (
              /* Its own scroll container, so a wide table never makes the page
                 itself scroll sideways on a phone. */
              <div key={i} className="mt-5 -mx-1 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-[16px]">
                  {b.head.length > 0 && (
                    <thead>
                      <tr>
                        {b.head.map((cell, j) => (
                          <th
                            key={j}
                            className="border-b border-[#D9CDBA] px-3 py-2 text-left font-medium text-[#2B2118]"
                          >
                            <Inlines nodes={cell} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="border-b border-[#E5D9C7] px-3 py-2 align-top leading-relaxed"
                          >
                            <Inlines nodes={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "details":
            return (
              <details key={i} className="mt-5 border-t border-[#E5D9C7]">
                <summary className="cursor-pointer py-4 text-[13px] uppercase tracking-[0.14em] text-[#8B5E34]">
                  <Inlines nodes={b.summary} />
                </summary>
                <div className="max-w-[65ch] pb-4">
                  <Blocks blocks={b.body} />
                </div>
              </details>
            );
          case "label":
            return (
              <p key={i} className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                <Inlines nodes={b.c} />
              </p>
            );
          case "ref":
            return (
              <p key={i} className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                <Inlines nodes={b.c} />
              </p>
            );
        }
      })}
    </>
  );
}
