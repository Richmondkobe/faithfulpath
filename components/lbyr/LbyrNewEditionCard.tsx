import { LBYR_NEW_PATH } from "@/lib/lbyr-new";

/**
 * The new edition's card on /members. Reads nothing: a member's progress is
 * shown on the course's own page. A plain link, as the course page is a whole
 * HTML page rather than a React one.
 */
export default function LbyrNewEditionCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Lead Before You’re Ready
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        Practical pastoral training for your first years of leading in a church: ten narrated lessons in three
        parts, from starting with yourself, through learning the craft, to facing what tests you.
      </p>
      <div className="mt-5">
        <a
          href={LBYR_NEW_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Open the course
        </a>
      </div>
    </section>
  );
}
