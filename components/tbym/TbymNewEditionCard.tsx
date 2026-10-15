import Link from "next/link";
import { TBYM_NEW_PATH } from "@/lib/tbym-new";
import { TBYM_OLD_RETIRED } from "@/lib/tbym-new-live";

/**
 * The Talk Before You Marry new edition on /members, shown only when TBYM_NEW_LIVE is on.
 * Reads nothing: a member's progress in the new edition is shown on its own
 * course page. The previous edition's card stays below it, unchanged, until
 * it is retired; then the "New edition" label and the starts-fresh line go too.
 */
export default function TbymNewEditionCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
      {!TBYM_OLD_RETIRED && (
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">New edition</p>
      )}
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Talk Before You Marry
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        A Christian course for couples preparing for marriage, rebuilt as 15 illustrated, narrated lessons in four
        parts: from making honesty safe, through the nine rooms of a shared life, to keeping talking.
      </p>
      {!TBYM_OLD_RETIRED && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It starts fresh. Anything you did in the previous edition stays where it is.
        </p>
      )}
      <div className="mt-5">
        <Link
          href={TBYM_NEW_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Open the course
        </Link>
      </div>
    </section>
  );
}
