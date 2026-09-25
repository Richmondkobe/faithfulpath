import { IBM_Plex_Mono } from "next/font/google";

import { getTbymCourse } from "@/lib/tbym-course";
import "./tbym.css";

// The approved preview sets its small uppercase labels in IBM Plex Mono. The
// site already uses the other two faces from that design — Newsreader for
// display and IBM Plex Sans for text — so this is the only one to add, and it
// is self-hosted by next/font like the others rather than fetched at runtime.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-tbym-mono",
});

/**
 * Chrome every page of this course carries.
 *
 * The footer is the short one the build brief requires on lessons: the two
 * support links, then the citation notice. Neither link has a destination yet —
 * the Safety and Support page is a later step, and the draft still brackets the
 * second link — so they render as visible development placeholders rather than
 * as anchors that go nowhere. Start Here and Safety and Support take the fuller
 * footer when they are built; that is a different layout, not this one.
 *
 * Gating is not done here. Every page re-checks the membership for itself,
 * because a layout is not a guard.
 */
export default function TbymLayout({ children }: { children: React.ReactNode }) {
  const course = getTbymCourse();

  return (
    <div className={`tbym ${mono.variable} min-h-screen`}>
      {children}

      <footer className="mx-auto max-w-[760px] px-4 pb-14">
        <div className="border-t border-[var(--tb-line)] pt-5 text-[13px] leading-relaxed text-[var(--tb-mute)]">
          <nav aria-label="Support" className="flex flex-wrap gap-x-5 gap-y-2">
            {course.footer_links.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[var(--tb-accent)] underline underline-offset-4"
                >
                  {link.label}
                </a>
              ) : (
                <span
                  key={link.label}
                  className="rounded-sm border border-dashed border-[var(--tb-accent)] px-2 py-1 text-[12px] text-[var(--tb-mute)]"
                  style={{ fontFamily: "var(--font-tbym-mono)" }}
                >
                  {link.label} — page not built yet
                </span>
              )
            )}
          </nav>
          <p className="mt-3">{course.notice}</p>
        </div>
      </footer>
    </div>
  );
}
