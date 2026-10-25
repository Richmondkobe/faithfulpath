import type { Metadata } from "next";
import Link from "next/link";
import CommunityNav from "@/components/community/CommunityNav";
import CommunityFooter from "@/components/community/CommunityFooter";
import PrayerPostForm from "@/components/community/PrayerPostForm";
import { DISPLAY, inputClass, labelClass, okClass, quietButtonClass } from "@/components/community/styles";
import { loadWall, requireCommunity } from "@/lib/community-db";
import {
  ANSWER_MAX,
  PRAYERS_PER_DAY,
  prayerName,
  shortDate,
  type PrayerAnswer,
  type PrayerRequest,
} from "@/lib/community";
import {
  deleteOwnPrayerRequest,
  markPrayerAnswered,
  prayForRequest,
  reportPrayerRequest,
} from "@/app/community/actions";

// Signed-in only (requireCommunity), never cached, and kept out of search:
// noindex here and Disallow in robots.ts.
export const metadata: Metadata = {
  title: "Prayer Wall",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ report?: string; remove?: string; reported?: string; tab?: string }> };

const STATUS_NOTE: Record<string, string> = {
  pending: "Waiting for Pastor Richmond to read it",
  rejected: "Not shown on the wall",
};

function PrayerCard({
  p,
  mine,
  prayed,
  reported,
  confirmReport,
  confirmRemove,
  answer,
}: {
  p: PrayerRequest;
  /** Their "Answered 🙌", if this person may see it. */
  answer?: PrayerAnswer;
  mine: boolean;
  prayed: boolean;
  reported: boolean;
  confirmReport: boolean;
  confirmRemove: boolean;
}) {
  const showNote = answer?.note && (answer.status === "approved" || mine);
  return (
    <li id={`p-${p.id}`} className="scroll-mt-6 rounded-2xl border border-line bg-paper p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold text-navy">
          {prayerName(p)}
          {mine && <span className="ml-2 text-[13px] font-medium text-gold-text">(yours)</span>}
        </p>
        <p className="text-[13px] text-muted">{shortDate(p.created_at)}</p>
      </div>
      {p.status !== "approved" && (
        <p className="mt-2 inline-block rounded-full bg-sand px-3 py-1 text-[13px] font-medium text-gold-text">
          {STATUS_NOTE[p.status]}
        </p>
      )}
      <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{p.body}</p>

      {p.answered_at && (
        <div className="mt-4 rounded-xl border border-gold-line/60 bg-sand px-4 py-3">
          <p className="font-semibold text-navy">
            Answered 🙌 <span className="text-[13px] font-normal text-muted">{shortDate(p.answered_at)}</span>
          </p>
          {showNote && <p className="mt-1 whitespace-pre-line leading-relaxed">{answer!.note}</p>}
          {mine && answer?.note && answer.status === "pending" && (
            <p className="mt-2 text-[13px] text-gold-text">Your praise update is waiting for Pastor Richmond to read it.</p>
          )}
          {mine && answer?.status === "hidden" && (
            <p className="mt-2 text-[13px] text-muted">Pastor Richmond has kept this off the Answered Prayers page.</p>
          )}
        </div>
      )}

      {p.status === "approved" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {prayed ? (
            <p className="inline-flex min-h-11 items-center rounded-xl bg-sand px-4 text-sm font-semibold text-gold-text">
              🙏 You prayed · {p.prayed_count}
            </p>
          ) : (
            <form action={prayForRequest}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className={quietButtonClass}>
                🙏 I prayed · {p.prayed_count}
              </button>
            </form>
          )}
          {!mine &&
            (reported ? (
              <span className="text-[13px] text-muted">Reported</span>
            ) : confirmReport ? (
              <form action={reportPrayerRequest} className="flex flex-wrap items-center gap-2 text-[13px]">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="confirm" value="yes" />
                <span className="text-muted">Send this back to Pastor Richmond to review?</span>
                <button type="submit" className="min-h-11 font-semibold text-danger underline underline-offset-4">
                  Yes, report it
                </button>
                <Link href={`/community/prayer#p-${p.id}`} className="min-h-11 content-center underline underline-offset-4">
                  Cancel
                </Link>
              </form>
            ) : (
              <form action={reportPrayerRequest}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="min-h-11 text-[13px] text-muted underline underline-offset-4 hover:text-danger">
                  Report
                </button>
              </form>
            ))}
        </div>
      )}

      {mine && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {p.status === "approved" && !p.answered_at && (
            <details>
              <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-gold-text">
                Mark answered 🙌
              </summary>
              <form action={markPrayerAnswered} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={p.id} />
                <div>
                  <label htmlFor={`note-${p.id}`} className={labelClass}>
                    A short praise update (optional)
                  </label>
                  <textarea
                    id={`note-${p.id}`}
                    name="answer_note"
                    rows={3}
                    maxLength={ANSWER_MAX}
                    aria-describedby={`note-help-${p.id}`}
                    className={inputClass}
                  />
                  <p id={`note-help-${p.id}`} className="mt-1 text-[13px] text-muted">
                    Up to {ANSWER_MAX} characters. Pastor Richmond reads it before it appears. Your request keeps the
                    name you chose: {prayerName(p)}.
                  </p>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-navy">
                  <input type="checkbox" name="share" defaultChecked className="h-5 w-5 accent-[#a97a29]" />
                  Share this on the Answered Prayers page
                </label>
                <button type="submit" className={quietButtonClass}>
                  Mark it answered
                </button>
              </form>
            </details>
          )}
          {confirmRemove ? (
            <form action={deleteOwnPrayerRequest} className="flex flex-wrap items-center gap-3 text-sm">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="confirm" value="yes" />
              <span className="text-muted">Delete this request for good?</span>
              <button type="submit" className="min-h-11 font-semibold text-danger underline underline-offset-4">
                Yes, delete it
              </button>
              <Link href={`/community/prayer#p-${p.id}`} className="underline underline-offset-4">
                Cancel
              </Link>
            </form>
          ) : (
            <form action={deleteOwnPrayerRequest}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="min-h-11 text-[13px] text-muted underline underline-offset-4 hover:text-danger">
                Delete my request
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

export default async function PrayerWall({ searchParams }: Props) {
  const viewer = await requireCommunity();
  const sp = await searchParams;
  const wall = await loadWall(viewer);
  const me = viewer.user.id;

  const card = (p: PrayerRequest) => (
    <PrayerCard
      key={p.id}
      p={p}
      mine={p.user_id === me}
      prayed={wall.prayed.has(p.id)}
      reported={wall.reported.has(p.id)}
      confirmReport={sp.report === p.id}
      confirmRemove={sp.remove === p.id}
      answer={wall.answers.get(p.id)}
    />
  );
  const answeredTab = sp.tab === "answered";
  const praying = wall.approved.filter((p) => !p.answered_at);
  const answered = wall.approved
    .filter((p) => p.answered_at)
    .sort((a, b) => (b.answered_at ?? "").localeCompare(a.answered_at ?? ""));
  const tabClass = (on: boolean) =>
    `flex min-h-11 items-center rounded-t-lg px-4 text-[15px] font-semibold ${
      on ? "border-b-2 border-gold text-navy" : "text-gold-text hover:text-navy"
    }`;

  return (
    <>
      <CommunityNav current="prayer" />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <h1 className="text-[2.25rem] leading-[1.1] text-navy sm:text-[2.75rem]" style={DISPLAY}>
          Prayer Wall
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          “Carry each other’s burdens.” Galatians 6:2. Share what you would like prayer for, and pray for one another.
        </p>

        {sp.reported === "1" && (
          <p role="status" className={`mt-6 ${okClass}`}>
            Thank you. That request is off the wall until Pastor Richmond has looked at it.
          </p>
        )}

        <nav aria-label="Prayer Wall" className="mt-8 flex gap-2 border-b border-line">
          <Link href="/community/prayer" aria-current={!answeredTab ? "page" : undefined} className={tabClass(!answeredTab)}>
            Praying
          </Link>
          <Link
            href="/community/prayer?tab=answered"
            aria-current={answeredTab ? "page" : undefined}
            className={tabClass(answeredTab)}
          >
            Answered{answered.length ? ` (${answered.length})` : ""}
          </Link>
        </nav>

        {answeredTab ? (
          <section aria-label="Answered" className="mt-8">
            <p className="leading-relaxed">
              Requests God has answered, newest first. The ones members chose to share are also on the{" "}
              <Link href="/community/answered" className="font-semibold text-gold-text underline underline-offset-4">
                Answered Prayers
              </Link>{" "}
              page.
            </p>
            {answered.length === 0 ? (
              <p className="mt-4 leading-relaxed text-muted">No answered prayers yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">{answered.map(card)}</ul>
            )}
          </section>
        ) : (
          <>
          <section aria-labelledby="share" className="mt-8 rounded-2xl border border-gold-line/60 bg-cream p-5 sm:p-6">
            <h2 id="share" className="text-xl text-navy" style={DISPLAY}>
              Share a prayer request
            </h2>
            {viewer.profile?.is_banned ? (
              <p className="mt-3 leading-relaxed text-muted">
                Sharing new requests is closed on this account. You can still pray for others. If you think this is a
                mistake, write to info@faithfulpathcommunity.com.
              </p>
            ) : !viewer.profile ? (
              <p className="mt-3 leading-relaxed text-muted">
                Add your name and country on the{" "}
                <Link href="/community/home#profile" className="font-semibold text-gold-text underline underline-offset-4">
                  community home
                </Link>{" "}
                first, and then you can share requests here.
              </p>
            ) : wall.postedToday >= PRAYERS_PER_DAY ? (
              <p className="mt-3 leading-relaxed text-muted">
                You have shared {PRAYERS_PER_DAY} prayer requests today. You can share another tomorrow.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Pastor Richmond reads every request before it appears on the wall. Please do not include anyone’s
                  full name or private details without their permission.
                </p>
                <div className="mt-5">
                  <PrayerPostForm firstName={viewer.profile.first_name} />
                </div>
              </>
            )}
          </section>

          {wall.mine.length > 0 && (
            <section aria-labelledby="waiting" className="mt-10">
              <h2 id="waiting" className="text-xl text-navy" style={DISPLAY}>
                Your requests not on the wall
              </h2>
              <ul className="mt-4 space-y-4">{wall.mine.map(card)}</ul>
            </section>
          )}

          <section aria-labelledby="wall" className="mt-10">
            <h2 id="wall" className="text-xl text-navy" style={DISPLAY}>
              Pray for others
            </h2>
            {praying.length === 0 ? (
              <p className="mt-4 leading-relaxed text-muted">No prayer requests on the wall yet. Yours could be the first.</p>
            ) : (
              <ul className="mt-4 space-y-4">{praying.map(card)}</ul>
            )}
          </section>
          </>
        )}
      </main>
      <CommunityFooter />
    </>
  );
}
