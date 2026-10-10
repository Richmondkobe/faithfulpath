import Link from "next/link";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import { RESET_OLD_RETIRED } from "@/lib/reset-new-live";

/**
 * The Reset new edition on /members, shown only when RESET_NEW_LIVE is on.
 * Reads nothing: a member's progress in the new edition is shown on its own
 * course page. The previous edition's card stays below it, unchanged.
 */
export default function NewEditionCard() {
  return (
    <section className="rounded-sm border border-[#C9A35A] bg-[#FBF5E8] px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">New edition</p>
      <h2
        className="mt-1 text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        The Christian Spiritual Reset
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
        A guided retreat for tired Christians, rebuilt as narrated lessons and retreat sessions: understand,
        prepare, take the retreat in the plan that fits your life, and come home well.
      </p>
      {!RESET_OLD_RETIRED && (
        <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
          It starts fresh. Anything you did in the previous edition, including your journal and any certificate,
          stays where it is.
        </p>
      )}
      <div className="mt-5">
        <Link
          href={RESET_NEW_PATH}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Open the course
        </Link>
      </div>
    </section>
  );
}
