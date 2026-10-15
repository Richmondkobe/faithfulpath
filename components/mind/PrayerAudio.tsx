import { getMindCourse } from "@/lib/mind-course";

/**
 * A guided prayer recording.
 *
 * `preload="none"` on purpose: a member opening a lesson has not asked to
 * download three megabytes, and several of these pages are read at night on a
 * phone.
 *
 * The ESV notice is required on every audio description as well as every page
 * footer, so it is carried here rather than relying on the page around it.
 */
export default function PrayerAudio({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  // Not recorded yet, or not uploaded: say so plainly rather than showing a
  // player that cannot play. Phase two adds the remaining prayers.
  if (!src) {
    return (
      <section className="mt-12 rounded-xl border border-line bg-sand px-5 py-5">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
          Guided prayer
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The recording for this page is not available yet. The prayer is
          written out below, and reading it is the same prayer.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-xl border border-line bg-sand px-5 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Guided prayer
      </h2>
      <p
        className="mt-2 text-lg text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {title}
      </p>

      <audio controls preload="none" className="mt-4 w-full">
        <source src={src} type="audio/mpeg" />
        Your browser cannot play this recording. The prayer is written out
        below.
      </audio>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Read by Pastor Richmond Kobe. You can stop it at any point, and you do
        not have to finish it.
      </p>
      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        {getMindCourse().scripture.notice}
      </p>
    </section>
  );
}
