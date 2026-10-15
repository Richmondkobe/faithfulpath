import Link from "next/link";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import { RESET_OLD_RETIRED } from "@/lib/reset-new-live";

/**
 * The Reset new edition on /members, shown only when RESET_NEW_LIVE is on.
 * Reads nothing: a member's progress in the new edition is shown on its own
 * course page. Once the previous edition is retired, the "New edition" label
 * and the starts-fresh line go, as on the other courses' cards.
 */
export default function NewEditionCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
      {!RESET_OLD_RETIRED && (
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">New edition</p>
      )}
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        The Christian Spiritual Reset
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        A guided retreat for tired Christians, rebuilt as narrated lessons and retreat sessions: understand,
        prepare, take the retreat in the plan that fits your life, and come home well.
      </p>
      {!RESET_OLD_RETIRED && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It starts fresh. Anything you did in the previous edition, including your journal and any certificate,
          stays where it is.
        </p>
      )}
      <div className="mt-5">
        <Link
          href={RESET_NEW_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Open the course
        </Link>
      </div>
    </section>
  );
}
