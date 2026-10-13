import Link from "next/link";
import { BYSY_NEW_PATH } from "@/lib/bysy-new";

/**
 * The Before You Say Yes new edition on /members, shown only when BYSY_NEW_LIVE is on.
 * Reads nothing: a member's progress in the new edition is shown on its own
 * course page. The previous edition's card stays below it, unchanged.
 */
export default function BysyNewEditionCard() {
  return (
    <section className="rounded-sm border border-[#C9A35A] bg-[#FBF5E8] px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">New edition</p>
      <h2
        className="mt-1 text-2xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Before You Say Yes
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
        A Christian course on dating with wisdom, rebuilt as 21 illustrated, narrated lessons in five parts: from why
        you want a relationship to the threshold of engagement.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
        It starts fresh. Anything you did in the previous edition stays where it is.
      </p>
      <div className="mt-5">
        <Link
          href={BYSY_NEW_PATH}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Open the course
        </Link>
      </div>
    </section>
  );
}
