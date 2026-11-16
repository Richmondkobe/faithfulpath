import Link from "next/link";
import { DEVOTIONAL_NAME, devotionFor } from "@/lib/devotional";
import { DISPLAY } from "@/components/community/styles";

/**
 * Today's devotion in brief, at the top of the community home: its title,
 * passage reference and opening lines, with a link to the whole of it on the
 * Prayer Wall. No Bible text is shown here. Nothing before the series begins.
 */
export default function DevotionalCard() {
  const d = devotionFor();
  if (!d) return null;
  // The first two sentences, as a taste of the reflection.
  const opening = (d.body.match(/^(?:[^.!?]+[.!?]+\s*){1,2}/)?.[0] ?? d.body).trim();

  return (
    <section aria-labelledby="devotional-card" className="mt-10 rounded-2xl border border-gold-line/60 bg-paper p-6 sm:p-7">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">
        {DEVOTIONAL_NAME} · Day {d.day}
      </p>
      <h2 id="devotional-card" className="mt-2 text-[1.6rem] leading-tight text-navy sm:text-[1.9rem]" style={DISPLAY}>
        {d.title}
      </h2>
      <p className="mt-2 text-[15px] font-semibold text-gold-text">{d.ref}</p>
      <p className="mt-3 leading-relaxed text-ink">{opening}</p>
      <p className="mt-4">
        <Link href="/community/prayer#devotional" className="font-semibold text-gold-text underline underline-offset-4">
          Read today&rsquo;s devotional and share your reflection ›
        </Link>
      </p>
    </section>
  );
}
