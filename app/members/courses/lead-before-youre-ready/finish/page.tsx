import type { Metadata } from "next";
import Link from "next/link";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import {
  LBYR_BASE,
  LBYR_SLUG,
  readLbyrLesson,
  readLbyrPage,
  requireLbyrPublished,
} from "@/lib/lbyr-course";
import Blocks from "@/components/lbyr/Blocks";
import LbyrShell, { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";
import LbyrProgress from "@/components/lbyr/LbyrProgress";
import LbyrHabitChoice from "@/components/lbyr/LbyrHabitChoice";

export const metadata: Metadata = {
  title: "Finish | Lead Before You’re Ready",
  robots: { index: false, follow: false },
};

/**
 * The unnumbered completion page.
 *
 * Reached from Lesson 10's Continue button, and from the overview once all ten
 * are complete. The four "look back" sentences and the nine-habit list are
 * private and saved nowhere — the page says so twice and means it. There is no
 * certificate, by instruction.
 */
export default async function LbyrFinish() {
  await requireActiveMember();
  requireLbyrPublished();

  const page = readLbyrPage("finish");
  const notice = readLbyrLesson(1).notice;
  const progress = await getCourseProgress(LBYR_SLUG);
  const completed = [...progress.values()].filter((p) => p.completed_at).length;

  const help = page.sections.find((s) => /^Need help/i.test(s.heading));
  const body = page.sections.filter((s) => !/^Need help/i.test(s.heading));

  return (
    <LbyrShell notice={notice}>
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Finish
        </p>
        <h1
          className="mt-2 text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {page.title}
        </h1>
        {page.sub && (
          <p className="mt-2 text-[19px] leading-snug text-[#6B5F53]">{page.sub}</p>
        )}
        <LbyrProgress completed={completed} />
      </Panel>

      {body.map((s, i) => {
        const closing = /^You have completed/i.test(s.heading);
        const Section = closing ? Panel : Plain;
        return (
          <Section key={i}>
            {s.heading && <SectionHeading>{s.heading}</SectionHeading>}
            {s.blocks.map((b, j) =>
              /* The nine habits become a radio list; nothing else changes. */
              b.t === "list" && b.cls === "habits" ? (
                <LbyrHabitChoice
                  key={j}
                  items={b.items.map((item) =>
                    item.flatMap((n) => (n.t === "p" ? n.c : []))
                  )}
                />
              ) : (
                <Blocks key={j} blocks={[b]} />
              )
            )}

            {closing && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={LBYR_BASE}
                  className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
                >
                  Back to the course overview
                </Link>
                {/* A plain anchor, not a Link, and the one on this page that
                    is. It leaves the members area for the public store, and a
                    client-side RSC fetch across that boundary failed on the
                    preview — the router got a redirect where it wanted a
                    payload and reported "This page couldn't load". A document
                    navigation asks for the page itself and cannot hit that.
                    The overview button above stays a Link: it stays inside
                    /members, where the navigation works. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
                    the document navigation is the point; see above. A relative
                    href rather than an absolute one so a reader reviewing a
                    preview stays on that preview. */}
                <a
                  href="/guides/lead-before-youre-ready"
                  className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#2B2118] px-7 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
                >
                  Read the book again
                </a>
              </div>
            )}
          </Section>
        );
      })}

      {help && (
        <Plain>
          <SectionHeading>{help.heading}</SectionHeading>
          <Blocks blocks={help.blocks} />
        </Plain>
      )}
    </LbyrShell>
  );
}
