import Link from "next/link";

import { LBYR_BASE } from "@/lib/lbyr-links";

/**
 * The course's card on the members page.
 *
 * Rendered only where LBYR_PUBLISHED is true, which it is not yet. It links to
 * the course entry rather than to Start Here, so a returning member lands on
 * their next unfinished lesson instead of the welcome page every time.
 */
export default function LbyrCourseCard() {
  return (
    <Link
      href={LBYR_BASE}
      className="group block rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-6 py-7 transition-colors hover:border-[#8B5E34]"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Ten lessons · Church leadership
      </p>
      <h3
        className="mt-2 text-xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Lead Before You’re Ready
      </h3>
      <p className="mt-2 leading-relaxed text-[#6B5F53]">
        Practical pastoral training for your first year or two of leading in a
        church.
      </p>
    </Link>
  );
}
