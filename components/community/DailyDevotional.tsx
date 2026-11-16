import { DEVOTIONAL_NAME, ESV_SHORT_NOTICE, devotionFor, esvText } from "@/lib/devotional";
import { DISPLAY } from "@/components/community/styles";

/**
 * Today's devotion, at the top of the Prayer Wall: the passage (ESV, when it
 * can be fetched), the reflection, a prayer and a question to respond to.
 * Nothing is shown before the series begins.
 */
export default async function DailyDevotional() {
  const d = devotionFor();
  if (!d) return null;
  const passage = await esvText(d.ref);

  return (
    <section aria-labelledby="devotional-title" className="mt-8 rounded-2xl border border-gold-line/60 bg-paper p-5 sm:p-7">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">
        {DEVOTIONAL_NAME} · Day {d.day}
      </p>
      <h2 id="devotional-title" className="mt-2 text-[1.6rem] leading-tight text-navy sm:text-[1.9rem]" style={DISPLAY}>
        {d.title}
      </h2>

      {passage ? (
        <blockquote className="mt-4 border-l-[3px] border-gold pl-4">
          <p className="text-lg leading-relaxed text-navy">&ldquo;{passage}&rdquo;</p>
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
