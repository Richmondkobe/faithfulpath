import type { Metadata } from "next";
import Link from "next/link";
import { DISPLAY } from "@/components/community/styles";
import EntryButton from "@/components/community/EntryButton";
import { socialMeta } from "@/lib/social-meta";
import {
  GUIDELINES,
  GUIDELINES_INTRO,
  GUIDELINES_PATH,
  GUIDELINES_TITLE,
  GUIDELINES_VERSE,
} from "@/lib/community-guidelines";

const DESCRIPTION = "How members of the Faithful Path Community treat one another: the guidelines every member agrees to.";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: DESCRIPTION,
  alternates: { canonical: GUIDELINES_PATH },
  ...socialMeta({ title: GUIDELINES_TITLE, description: DESCRIPTION, path: GUIDELINES_PATH }),
};

/** Public, so anyone can read them before joining. Static. */
export default function CommunityGuidelines() {
  return (
    <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Faithful Path Community</p>
      <h1 className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]" style={DISPLAY}>
        {GUIDELINES_TITLE}
      </h1>
      <p className="mt-6 text-lg leading-relaxed">{GUIDELINES_INTRO}</p>
      <ol className="mt-8 space-y-4">
        {GUIDELINES.map(([lead, rest], i) => (
          <li key={lead} className="flex gap-4 rounded-2xl border border-line bg-paper p-5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-sun"
            >
              {i + 1}
            </span>
            <p className="leading-relaxed">
              <span className="sr-only">{i + 1}. </span>
              <strong className="font-semibold text-navy">{lead}</strong>
              {rest}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-10 border-l-2 border-gold pl-5 text-lg leading-relaxed text-navy" style={DISPLAY}>
        {GUIDELINES_VERSE}
      </p>
      <div className="mt-12 rounded-2xl bg-navy px-5 py-8 text-center">
        <EntryButton />
      </div>
      <p className="mt-8 text-sm text-muted">
        <Link href="/community" className="text-gold-text underline underline-offset-4">
          About the community
        </Link>
      </p>
    </main>
  );
}
