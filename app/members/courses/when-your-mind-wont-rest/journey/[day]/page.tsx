import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findDay,
  findResource,
  getJourneyModule,
  readPageFile,
  resourceSlug,
} from "@/lib/mind-course";
import { getJourneyProgress } from "@/lib/mind-progress";
import { recordDayVisit } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import { signedMediaUrl } from "@/lib/course-media";
import { mindDayHref, mindJourneyHref, mindResourceHref, slugFromFile } from "@/lib/mind-links";
import MindMarkdown from "@/components/mind/MindMarkdown";
import DayStatusControl from "@/components/mind/DayStatus";
import PrayerAudio from "@/components/mind/PrayerAudio";

export const metadata: Metadata = {
  title: "The 30-Day Mind-Renewal Journey | Faithful Path Community",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ day: string }> };

export function generateStaticParams() {
  return getJourneyModule().pages.map((p) => ({ day: String(p.day) }));
}

/**
 * One day of the journey.
 *
 * Any day opens, whatever the date and whatever came before it — the manifest
 * says so twice, at any_day_openable_without_calendar_date and at
 * no_prerequisite_locks, and there is no code here that could refuse one.
 *
 * Opening records a visit and nothing else. It does not complete the day, and
 * the status below is the member's to give or withhold.
 */
export default async function JourneyDay({ params }: Props) {
  await requireActiveMember();

  const { day: raw } = await params;
  if (!/^[1-9][0-9]?$/.test(raw)) notFound();
  const day = Number(raw);

  const page = findDay(day);
  if (!page) notFound();

  const file = readPageFile(page.file);
  if (!file) notFound();

  // A visit is recorded when the page opens, independently of any status. The
  // write is idempotent, so a reload never moves the date.
  await recordDayVisit(day);

  const progress = await getJourneyProgress();
  const state = progress.get(day);

  const audioId = typeof file.front.audio === "string" ? file.front.audio : null;
  const audioSrc = audioId ? await signedMediaUrl("audio", `${audioId}.mp3`) : null;

  const worksheets = (page.resources ?? [])
    .map((ref) => findResource(ref))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const support = getJourneyModule().status_config?.need_support_opens ?? "";
  const supportSlug = slugFromFile(support || "m0/lessons/06-finding-help-where-you-live.md");

  const previous = day > 1 ? day - 1 : null;
  const next = day < 30 ? day + 1 : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 sm:pt-24">
      <Link
        href={mindJourneyHref()}
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← The 30-Day Mind-Renewal Journey
      </Link>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {page.week_title}
      </p>

      <article className="mt-2">
        <MindMarkdown source={file.body} />
      </article>

      {audioId && <PrayerAudio src={audioSrc} title={page.title} />}

      {worksheets.length > 0 && (
        <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
            {page.label ?? "Worksheet"}
          </h2>
          <ul className="mt-4 space-y-2">
            {worksheets.map((resource) => (
              <li key={resource.file}>
                <Link
                  href={mindResourceHref(resourceSlug(resource))}
                  className="text-[#2B2118] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
                >
                  {resource.toolkit_number}. {resource.title}
                </Link>
                {resource.not_for_group_sharing && (
                  <span className="mt-1 block text-sm text-[#6B5F53]">
                    Private — not for group sharing.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <DayStatusControl day={day} saved={state?.status ?? null} supportPageSlug={supportSlug} />

      <nav className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5D9C7] pt-8">
        {previous ? (
          <Link href={mindDayHref(previous)} className="text-sm text-[#8B5E34] underline underline-offset-4 hover:text-[#2B2118]">
            ← Day {previous}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={mindDayHref(next)} className="text-sm text-[#8B5E34] underline underline-offset-4 hover:text-[#2B2118]">
            Day {next} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
