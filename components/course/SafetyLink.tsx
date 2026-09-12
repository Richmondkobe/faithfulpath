import Link from "next/link";

/** The persistent "Get Help Now" link. Small, never alarming, always there. */
export default function SafetyLink({
  courseSlug,
  className = "",
}: {
  courseSlug: string;
  className?: string;
}) {
  return (
    <Link
      href={`/members/courses/${courseSlug}/00-finding-help-where-you-live`}
      className={`inline-flex items-center gap-1.5 rounded-sm border border-[#C98A7E] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#8B3A2E] transition-colors hover:bg-[#FBF1EF] ${className}`}
    >
      Get Help Now
    </Link>
  );
}
