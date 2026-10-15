import Link from "next/link";
import { BYSY_NEW_PATH } from "@/lib/bysy-new";
import { BYSY_OLD_RETIRED } from "@/lib/bysy-new-live";

/**
 * The Before You Say Yes new edition on /members, shown only when BYSY_NEW_LIVE is on.
 * Reads nothing: a member's progress in the new edition is shown on its own
 * course page. The previous edition's card stays below it, unchanged.
 */
export default function BysyNewEditionCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
      {!BYSY_OLD_RETIRED && (
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">New edition</p>
      )}
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Before You Say Yes
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        A Christian course on dating with wisdom, rebuilt as 21 illustrated, narrated lessons in five parts: from why
        you want a relationship to the threshold of engagement.
      </p>
      {!BYSY_OLD_RETIRED && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It starts fresh. Anything you did in the previous edition stays where it is.
        </p>
      )}
      <div className="mt-5">
        <Link
          href={BYSY_NEW_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Open the course
        </Link>
      </div>
    </section>
  );
}
