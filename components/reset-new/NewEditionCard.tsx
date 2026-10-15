import Link from "next/link";
import { RESET_NEW_PATH } from "@/lib/reset-new";

/**
 * The course's card on /members. Reads nothing: a member's progress is shown
 * on the course's own page.
 */
export default function NewEditionCard() {
  return (
    <section className="rounded-2xl border border-gold bg-paper px-5 py-5">
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
