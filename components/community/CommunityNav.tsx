import Link from "next/link";
import { communitySignOut } from "@/app/community/actions";

const LINKS = [
  { href: "/community/home", label: "Community home", key: "home" },
  { href: "/community/prayer", label: "Prayer Wall", key: "prayer" },
  { href: "/community/gathering", label: "Weekly Gathering", key: "gathering" },
  { href: "/community/questions", label: "Ask Pastor Richmond", key: "questions" },
] as const;

/** The strip across the top of the signed-in community pages. */
export default function CommunityNav({ current }: { current: (typeof LINKS)[number]["key"] }) {
  return (
    <div className="border-b border-line bg-sand">
      {/* One row. On a phone it scrolls sideways rather than wrapping onto three. */}
      <div className="mx-auto flex max-w-3xl items-center gap-x-4 overflow-x-auto px-4 [scrollbar-width:thin] sm:px-6">
        <nav aria-label="Community" className="-mx-2 flex shrink-0 items-center whitespace-nowrap text-[15px] font-semibold">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              aria-current={current === l.key ? "page" : undefined}
              className={`flex min-h-12 items-center px-2 transition-colors ${
                current === l.key ? "text-navy underline decoration-gold decoration-2 underline-offset-8" : "text-gold-text hover:text-navy"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={communitySignOut} className="ml-auto shrink-0">
          <button type="submit" className="min-h-12 whitespace-nowrap text-sm text-muted underline-offset-4 hover:text-gold-text hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
