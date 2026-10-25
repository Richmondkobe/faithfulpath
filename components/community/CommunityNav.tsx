import Link from "next/link";
import { communitySignOut } from "@/app/community/actions";

const LINKS = [
  { href: "/community/home", label: "Community home", key: "home" },
  { href: "/community/prayer", label: "Prayer Wall", key: "prayer" },
  { href: "/community/gathering", label: "Weekly Gathering", key: "gathering" },
] as const;

/** The strip across the top of the signed-in community pages. */
export default function CommunityNav({ current }: { current: (typeof LINKS)[number]["key"] }) {
  return (
    <div className="border-b border-line bg-sand">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
        <nav aria-label="Community" className="-mx-2 flex flex-wrap items-center text-[15px] font-semibold">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              aria-current={current === l.key ? "page" : undefined}
              className={`flex min-h-11 items-center px-2 transition-colors ${
                current === l.key ? "text-navy underline decoration-gold decoration-2 underline-offset-8" : "text-gold-text hover:text-navy"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={communitySignOut}>
          <button type="submit" className="min-h-11 text-sm text-muted underline-offset-4 hover:text-gold-text hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
