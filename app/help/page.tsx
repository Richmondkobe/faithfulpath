import { readFileSync } from "node:fs";
import { HELP_PATH } from "@/lib/site";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import ArticleBody from "@/components/ArticleBody";
import { remarkAutolink, remarkHardBreaks } from "@/lib/markdown-plugins";

// The live copy of the resources page printed at the back of the book. It is
// kept as a file in the repo rather than in Supabase so a correction is an
// ordinary edit and redeploy. Read once, at build time — the page is static.
const SOURCE = readFileSync(
  join(process.cwd(), "content", "before-you-say-yes-resources-page.md"),
  "utf8"
);

const TITLE = "Finding Help Where You Live";

export const metadata: Metadata = {
  title: `${TITLE}`,
  description:
    "Emergency numbers, crisis and abuse helplines, forced-marriage support, debt advice and counselling registers, by country.",
  alternates: { canonical: HELP_PATH },
  openGraph: {
    type: "article",
    url: HELP_PATH,
    title: TITLE,
    description:
      "Emergency numbers, crisis and abuse helplines, forced-marriage support, debt advice and counselling registers, by country.",
    siteName: "Faithful Path Community",
    images: ["/og-site.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Emergency numbers, crisis and abuse helplines, forced-marriage support, debt advice and counselling registers, by country.",
    images: ["/og-site.png"],
  },
};

export default function FindingHelp() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 break-words sm:pt-24">
      <Link
        href="/"
        className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
      >
        ← Home
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {TITLE}
      </h1>

      {/* The source is prose kept one entry per line, with bare web addresses.
          The two plugins make it behave the way it reads. */}
      <ArticleBody
        source={SOURCE}
        title={TITLE}
        remarkPlugins={[remarkHardBreaks, remarkAutolink]}
      />
    </main>
  );
}
