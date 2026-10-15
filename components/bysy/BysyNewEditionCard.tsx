import Link from "next/link";
import { BYSY_NEW_PATH } from "@/lib/bysy-new";

/**
 * The course's card on /members. Reads nothing: a member's progress is shown
 * on the course's own page.
 */
export default function BysyNewEditionCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
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
