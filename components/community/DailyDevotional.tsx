import Link from "next/link";
import ReflectionForm from "@/components/community/ReflectionForm";
import { DEVOTIONAL_NAME, ESV_SHORT_NOTICE, devotionAt, devotionalSeq, esvText, type Reflection } from "@/lib/devotional";
import { DISPLAY } from "@/components/community/styles";
import { posterName, shortDate } from "@/lib/community";
import type { CommunityViewer } from "@/lib/community-db";
import { deleteOwnReflection } from "@/app/community/actions";

/**
 * Today's devotion, at the top of the Prayer Wall: the passage (ESV, when it
 * can be fetched), the reflection, a prayer and a question, then what
 * members have written in reply and a box to add their own. A member's
 * reflection shows to others once Pastor Richmond has approved it; until
 * then only its author sees it. Nothing is shown before the series begins.
 */
export default async function DailyDevotional({ viewer }: { viewer: CommunityViewer }) {
  const seq = devotionalSeq();
  if (seq === null) return null;
  const d = devotionAt(seq);
  const [passage, rows] = await Promise.all([
    esvText(d.ref),
    // Row-level security returns the approved ones and the viewer's own.
    viewer.supabase.from("devotional_reflections").select("*").eq("day_seq", seq).order("created_at", { ascending: true }).limit(200),
  ]);
  // If the reflections table is not there yet, the devotion is shown without them.
  const reflectionsOn = !rows.error;
  if (rows.error) console.error("Daily devotional: reflections not loaded:", rows.error.message);
  const all = (rows.data ?? []) as Reflection[];
  const shown = all.filter((r) => r.status === "approved" || r.user_id === viewer.user.id);
  const canShare = !!viewer.profile && !viewer.profile.is_banned && !viewer.needsAgreement;

  return (
    <section id="devotional" aria-labelledby="devotional-title" className="mt-8 scroll-mt-6 rounded-2xl border border-gold-line/60 bg-paper p-5 sm:p-7">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">
        {DEVOTIONAL_NAME} · Day {d.day}
      </p>
      <h2 id="devotional-title" className="mt-2 text-[1.6rem] leading-tight text-navy sm:text-[1.9rem]" style={DISPLAY}>
        {d.title}
      </h2>

      {passage ? (
        <blockquote className="mt-4 border-l-[3px] border-gold pl-4">
          {/* No quotation marks added: the ESV text brings its own where the passage is speech. */}
          <p className="text-lg leading-relaxed text-navy">{passage}</p>
          <footer className="mt-2 text-[15px] font-semibold text-gold-text">
            <cite className="not-italic">{d.ref}</cite> <span className="font-normal text-muted">(ESV)</span>
          </footer>
        </blockquote>
      ) : (
        <p className="mt-4 border-l-[3px] border-gold pl-4 text-lg leading-relaxed text-navy">
          Today&rsquo;s passage: <span className="font-semibold">{d.ref}</span>. Please read it in your Bible first.
        </p>
      )}

      <p className="mt-5 leading-relaxed text-ink">{d.body}</p>

      <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Prayer</h3>
      <p className="mt-2 italic leading-relaxed text-ink">{d.prayer}</p>

      <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Reflect</h3>
      <p className="mt-2 leading-relaxed text-ink">{d.question}</p>

      {reflectionsOn && (
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">
            Reflections{shown.filter((r) => r.status === "approved").length ? ` (${shown.filter((r) => r.status === "approved").length})` : ""}
          </h3>
          {shown.length === 0 ? (
            <p className="mt-2 leading-relaxed text-muted">No reflections yet today. Yours could be the first.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {shown.map((r) => {
                const mine = r.user_id === viewer.user.id;
                return (
                  <li key={r.id} className="rounded-xl border border-line bg-cream p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                      <p className="font-semibold text-navy">
                        {r.display_name}
                        {mine && <span className="ml-2 font-normal text-gold-text">(yours)</span>}
                      </p>
                      <p className="text-muted">{shortDate(r.created_at)}</p>
                    </div>
                    {mine && r.status !== "approved" && (
                      <p className="mt-2 inline-block rounded-full bg-sand px-3 py-0.5 text-[13px] text-gold-text">
                        {r.status === "pending" ? "Waiting for Pastor Richmond to read it" : "Not shown to others"}
                      </p>
                    )}
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-ink">{r.body}</p>
                    {mine && (
                      <form action={deleteOwnReflection} className="mt-3">
                        <input type="hidden" name="id" value={r.id} />
                        <button className="text-sm text-muted underline underline-offset-4 hover:text-navy">Delete my reflection</button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5">
            {canShare && viewer.profile ? (
              <ReflectionForm firstName={posterName({ isAdmin: viewer.isAdmin, profile: viewer.profile })} direct={viewer.isAdmin} />
            ) : viewer.profile?.is_banned ? (
              <p className="leading-relaxed text-muted">Sharing is closed on this account.</p>
            ) : (
              <p className="leading-relaxed text-muted">
                Add your name and country on the{" "}
                <Link href="/community/home#profile" className="font-semibold text-gold-text underline underline-offset-4">
                  community home
                </Link>{" "}
                first, and then you can share a reflection here.
              </p>
            )}
          </div>
        </div>
      )}

      {passage && (
        <p className="mt-6 text-[11px] leading-relaxed text-muted">
          {ESV_SHORT_NOTICE}{" "}
          <a href="https://www.esv.org" rel="noopener" className="underline underline-offset-2">
            ESV.org
          </a>
        </p>
      )}
    </section>
  );
}
