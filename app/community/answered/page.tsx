import type { Metadata } from "next";
import Link from "next/link";
import CommunityNav from "@/components/community/CommunityNav";
import CommunityFooter from "@/components/community/CommunityFooter";
import { DISPLAY } from "@/components/community/styles";
import { loadAnswered, requireCommunity } from "@/lib/community-db";
import { prayerName, shortDate } from "@/lib/community";

// Signed-in members only (requireCommunity), never cached, and kept out of
// search: noindex here and Disallow in robots.ts.
export const metadata: Metadata = {
  title: "Answered Prayers",
  robots: { index: false, follow: false },
};

/**
 * Answered prayers members chose to share, newest answer first. Only ones
 * Richmond has approved (an update waits for him) and has not hidden, on
 * requests still on the wall: the database leaves out the rest.
 */
export default async function AnsweredPrayers() {
  const viewer = await requireCommunity();
  const answered = await loadAnswered(viewer);

  return (
    <>
      <CommunityNav current="prayer" />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <h1 className="text-[2.25rem] leading-[1.1] text-navy sm:text-[2.75rem]" style={DISPLAY}>
          Answered Prayers
        </h1>
        <p className="mt-4 text-lg leading-relaxed" style={DISPLAY}>
          &ldquo;Give thanks to the LORD, for he is good.&rdquo; (Psalm 107:1)
        </p>

        {answered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-line bg-paper px-5 py-6 leading-relaxed text-muted">
            No answered prayers have been shared yet. When God answers yours, mark it &ldquo;Answered 🙌&rdquo; on the{" "}
            <Link href="/community/prayer" className="font-semibold text-gold-text underline underline-offset-4">
              Prayer Wall
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-10 space-y-5">
            {answered.map((a) => (
              <li key={a.request_id} className="rounded-2xl border border-gold-line/60 bg-paper p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-semibold text-navy">{prayerName(a.request)}</p>
                  <p className="text-[13px] text-muted">Answered {shortDate(a.request.answered_at ?? a.created_at)}</p>
                </div>
                <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.12em] text-gold-text">The prayer</p>
                <p className="mt-1 whitespace-pre-line leading-relaxed text-ink">{a.request.body}</p>
                {a.note && (
                  <div className="mt-4 rounded-xl bg-navy px-4 py-4">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-soft">Answered 🙌</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed text-sun">{a.note}</p>
                  </div>
                )}
                <p className="mt-4 text-[15px] text-muted">
                  🙏 {a.request.prayed_count} {a.request.prayed_count === 1 ? "person" : "people"} prayed
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10">
          <Link href="/community/prayer" className="font-semibold text-gold-text underline underline-offset-4">
            ‹ Back to the Prayer Wall
          </Link>
        </p>
        <CommunityFooter />
      </main>
    </>
  );
}
