import type { Metadata } from "next";
import CommunityNav from "@/components/community/CommunityNav";
import LocalTime from "@/components/community/LocalTime";
import { DISPLAY, quietButtonClass } from "@/components/community/styles";
import { nextGathering, requireCommunity } from "@/lib/community-db";

export const metadata: Metadata = {
  title: "Weekly Gathering",
  robots: { index: false, follow: false },
};

/** The next gathering. The Zoom link is only ever in this signed-in page and its calendar file. */
export default async function WeeklyGathering() {
  const viewer = await requireCommunity();
  const g = await nextGathering(viewer.supabase);

  return (
    <>
      <CommunityNav current="gathering" />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <h1 className="text-[2.25rem] leading-[1.1] text-navy sm:text-[2.75rem]" style={DISPLAY}>
          Weekly Gathering
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          Each week we meet online on Zoom to pray and open the Bible together. Come as you are.
        </p>

        {g ? (
          <section aria-labelledby="next" className="mt-8 rounded-2xl bg-navy p-5 sm:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Next gathering</p>
            <h2 id="next" className="mt-2 text-2xl text-sun sm:text-3xl" style={DISPLAY}>
              {g.title}
            </h2>
            <div className="mt-5 rounded-xl bg-paper px-4 py-4">
              <LocalTime iso={g.starts_at} />
            </div>
            {g.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-sand">{g.description}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={g.zoom_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-14 items-center justify-center rounded-xl bg-gold px-6 text-[17px] font-semibold text-night transition-colors hover:bg-gold-soft"
              >
                Join on Zoom
              </a>
              <a href={`/community/gathering/${g.id}/calendar`} className={`${quietButtonClass} min-h-14 text-[15px]`}>
                Add to calendar
              </a>
            </div>
            <p className="mt-4 text-[13px] text-sand">The Zoom link is for community members only. Please do not share it.</p>
          </section>
        ) : (
          <p className="mt-8 rounded-2xl border border-line bg-paper px-5 py-6 leading-relaxed text-muted">
            The next gathering has not been set yet. Please check back soon.
          </p>
        )}
      </main>
    </>
  );
}
