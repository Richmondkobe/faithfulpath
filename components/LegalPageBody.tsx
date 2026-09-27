import type { ReactNode } from "react";

import ArticleBody from "@/components/ArticleBody";
import { remarkAutolink } from "@/lib/markdown-plugins";

/**
 * The shared frame for /privacy, /terms and /pastoral-terms.
 *
 * The three differ only in their title, their source file and their metadata,
 * so the layout lives here rather than three times over. The measure is the
 * same 2xl the resources page uses: legal prose is read in paragraphs, and a
 * wider column makes a numbered clause harder to follow, not easier.
 *
 * `title` is passed down to ArticleBody as well as rendered, which is what
 * makes it drop the file's own opening "# Privacy Policy" instead of printing
 * a second headline under the real one.
 */
export default function LegalPageBody({
  title,
  source,
  children,
}: {
  title: string;
  source: string;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 break-words sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Legal
      </p>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {title}
      </h1>

      {/* remarkAutolink turns the bare info@ address into a mailto link, which
          is the one thing these pages ask a reader to act on. */}
      <ArticleBody source={source} title={title} remarkPlugins={[remarkAutolink]} />

      {children}
    </main>
  );
}
