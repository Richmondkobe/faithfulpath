import { SF_PATH } from "@/lib/stand-firm";

/**
 * The course's card on /members. Reads nothing: a member's progress is shown
 * on the course's own page.
 */
export default function StandFirmCourseCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
      <h2
        className="text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Stand Firm
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        A Christian course on spiritual warfare and the armour of God: 12 illustrated, narrated lessons in four parts,
        from understanding the battle to living in victory.
      </p>
      <div className="mt-5">
        {/* A plain link: the course page is a whole HTML document, so <Link> would pre-load it and the request would hang. */}
        <a
          href={SF_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Open the course
        </a>
      </div>
    </section>
  );
}
