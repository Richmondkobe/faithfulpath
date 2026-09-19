import Link from "next/link";
import { bysySupportHref } from "@/lib/bysy-links";
import ExitControl from "@/components/bysy/ExitControl";

/**
 * What every page of this course carries, to build notes §3.
 *
 * The support link and the standing support line appear on every page, and
 * neither requires completing anything to reach. The exit control stays visible
 * while the learner scrolls.
 *
 * All three live in the layout rather than on each route, because "every page"
 * is the requirement and a page added later would otherwise be the one that
 * quietly lacks them.
 */
export default function BysyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Above the content, not below it: someone who needs this should meet it
          before the lesson rather than after scrolling past the whole page. */}
      <div className="border-b border-[#E5D9C7] bg-[#F7F1E6]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-3">
          <p className="text-sm leading-relaxed text-[#4A4038]">
            Are you afraid, under pressure or unsure whether you are safe?
          </p>
          <Link
            href={bysySupportHref()}
            className="text-sm font-medium text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Get support
          </Link>
        </div>
      </div>

      {/* Room at the foot so the exit control never sits over the last line. */}
      <div className="pb-20">{children}</div>

      <ExitControl />
    </>
  );
}
