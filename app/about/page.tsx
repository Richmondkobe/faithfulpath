import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import ArticleBody from "@/components/ArticleBody";
import JsonLd from "@/components/JsonLd";
import { remarkAutolink } from "@/lib/markdown-plugins";
import { graph, personRichmond } from "@/lib/schema";
import { COUNTRIES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Pastor Richmond Kobe | Faithful Path Community",
  description:
    "Richmond Kobe has pastored for more than twenty years across ten countries. Here is who he is and how he works with people one at a time.",
  alternates: { canonical: "/about" },
};

// The page's text, read once at build time. A file rather than a Supabase row,
// like the legal pages: it is authored prose, it versions with the code, and a
// correction is an ordinary edit and a redeploy.
const SOURCE = readFileSync(join(process.cwd(), "content", "about.md"), "utf8");

/** The H1 comes from the file, so the page and the file cannot drift apart. */
const TITLE = SOURCE.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "About";

// Two lines are lifted out of the Markdown so they can keep the presentation
// they had before the page became a file.
//
// The country list is one line of names in the source. Rendered as prose it is
// a long grey sentence; it has always been set small, spaced and between rules,
// which is what makes it read as a list of places rather than a paragraph.
// Splitting on the joined constant also asserts that the file and
// lib/site.ts still agree — if either changes, the split fails loudly below
// rather than quietly losing the styling.
const COUNTRY_LINE = COUNTRIES.join(" · ");

// The closing link is a button on this page, not a sentence with a link in it.
const BUTTON_LINE = `[Talk to a pastor — ${SITE.price}](/talk-to-a-pastor)`;

// Matched as a whole line, not as a substring: a country appended to the end of
// the line would otherwise split cleanly and leave " · Malaysia" stranded at the
// top of the next paragraph.
const COUNTRY_BLOCK = new RegExp(
  `^${COUNTRY_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
  "m"
);
const countryMatch = SOURCE.match(COUNTRY_BLOCK);
if (!countryMatch || countryMatch.index === undefined) {
  throw new Error(
    'content/about.md has no line reading exactly COUNTRIES.join(" · ") from lib/site.ts — update one to match the other, or the country list loses its styling.'
  );
}
const countryAt = countryMatch.index;
const beforeCountries = SOURCE.slice(0, countryAt);
const afterCountries = SOURCE.slice(countryAt + countryMatch[0].length);
if (!afterCountries.includes(BUTTON_LINE)) {
  throw new Error(
    `content/about.md no longer ends with the link "${BUTTON_LINE}" — the button below would be a second call to action.`
  );
}
const BODY_AFTER = afterCountries.replace(BUTTON_LINE, "").trimEnd();

export default function About() {
  return (
    <>
      <JsonLd data={graph(personRichmond())} />

      <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
        {/* The portrait sits beside the heading from 640px up and above it on a
            phone, where a square photo next to a three-line title leaves too
            little room for either. */}
        <div className="flex flex-col gap-8 sm:flex-row-reverse sm:items-start sm:gap-10">
          <div className="relative aspect-square w-full max-w-[13rem] shrink-0 overflow-hidden rounded-sm">
            <Image
              src="/richmond.jpg"
              alt="Richmond Kobe, pastor at Faithful Path Community"
              fill
              priority
              sizes="13rem"
              className="object-cover"
            />
          </div>

          <h1
            className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {TITLE}
          </h1>
        </div>

        {/* Rendered as the legal pages are: the same body component, and
            remarkAutolink for the bare addresses. */}
        <ArticleBody
          source={beforeCountries}
          title={TITLE}
          remarkPlugins={[remarkAutolink]}
        />

        <div className="mt-10 border-y border-[#E5D9C7] py-8">
          <p className="text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#6B5F53]">
            {COUNTRY_LINE}
          </p>
        </div>

        <ArticleBody source={BODY_AFTER} remarkPlugins={[remarkAutolink]} />

        <Link
          href="/talk-to-a-pastor"
          className="mt-8 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Talk to a pastor — {SITE.price}
        </Link>
      </main>
    </>
  );
}
