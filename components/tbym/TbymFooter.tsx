import Link from "next/link";

import { getTbymCourse } from "@/lib/tbym-course";

/**
 * The two footers this course uses.
 *
 * The build brief fixes both. A lesson takes the short one — two support links,
 * then the citation notice — because a page someone is working through should
 * not end in site navigation. Start Here and Safety and Support take the fuller
 * one, because those are the pages a learner arrives at rather than works
 * through, and the ordinary links belong there.
 *
 * `omit` drops a single link, for a page that would otherwise link to itself.
 * Safety and Support, Privacy and Terms all appear in the fuller footer, and
 * each passes its own href.
 *
 * A destination that does not exist yet renders as a marked placeholder rather
 * than as a link that goes nowhere.
 */
export default function TbymFooter({
  variant,
  omit,
}: {
  variant: "short" | "full";
  /** A link to leave out, named by the page that link points at. */
  omit?: string;
}) {
  const course = getTbymCourse();
  const links = (
    variant === "short" ? course.footer_links : course.full_footer_links
  ).filter((link) => !omit || link.href !== omit);

  return (
    <footer className="mx-auto max-w-[760px] px-4 pb-14">
      <div className="border-t border-[var(--tb-line)] pt-5 text-[13px] leading-relaxed text-[var(--tb-mute)]">
        <nav
          aria-label={variant === "short" ? "Support" : "Site"}
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {links.map((link) =>
            link.href ? (
              <Link
                key={link.label}
                href={link.href}
                className="text-[var(--tb-accent)] underline underline-offset-4"
              >
                {link.label}
              </Link>
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
  );
}
