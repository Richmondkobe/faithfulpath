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
        <strong key={k} className="font-medium text-navy">
          {inline(n.c, i)}
        </strong>
      );
    if (n.t === "small")
      return (
        <small key={k} className="text-[0.75em] font-normal text-muted">
          {inline(n.c, i)}
        </small>
      );

    const label = n.c.map((c) => (c.t === "text" ? c.v : "")).join("");
    if (/Concerns, Care and Reporting/i.test(label)) {
      return (
        <Link
          key={k}
          href={lbyrConcernsHref}
          className="text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
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
          className="text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
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
    "text-[19px] leading-relaxed text-navy [font-family:var(--font-display)]",
  note: "text-[15px] leading-relaxed text-muted",
  opt: "mt-5 rounded-xl border border-line bg-cream px-4 py-3 text-[16px] leading-relaxed text-ink",
  safety:
    "mt-5 rounded-xl border-l-[3px] border-gold-text bg-sand px-4 py-3 text-[16px] leading-relaxed text-navy",
  sub: "text-[19px] leading-snug text-muted",
  done: "text-[19px] leading-snug text-navy [font-family:var(--font-display)]",
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
                  className="mt-7 text-[19px] leading-snug text-navy"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  <Inlines nodes={b.c} />
                </h3>
              );
            return (
              <h2
                key={i}
                className="mt-8 text-[1.6rem] leading-tight text-navy"
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
                <p className="text-[18px] font-medium leading-snug text-navy">
                  <Inlines nodes={b.term} />
                </p>
                <div className="mt-1 text-[17px] leading-relaxed text-ink">
                  <Blocks blocks={b.body} />
                </div>
              </div>
            );
          case "dl":
            return (
              <dl key={i} className="mt-5 space-y-4">
                {b.items.map((item, j) => (
                  <div key={j} className="rounded-xl border border-line px-4 py-3">
                    <dt className="text-[17px] font-medium text-navy">
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
                            className="border-b border-field px-3 py-2 text-left font-medium text-navy"
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
                            className="border-b border-line px-3 py-2 align-top leading-relaxed"
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
              <details key={i} className="mt-5 border-t border-line">
                <summary className="cursor-pointer py-4 text-[13px] uppercase tracking-[0.14em] text-gold-text font-medium">
                  <Inlines nodes={b.summary} />
                </summary>
                <div className="max-w-[65ch] pb-4">
                  <Blocks blocks={b.body} />
                </div>
              </details>
            );
          case "label":
            return (
              <p key={i} className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
                <Inlines nodes={b.c} />
              </p>
            );
          case "ref":
            return (
              <p key={i} className="mt-2 text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
                <Inlines nodes={b.c} />
              </p>
            );
        }
      })}
    </>
  );
}
