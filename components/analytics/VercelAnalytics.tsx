"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics, on the public side of the site only.
 *
 * A client component rather than <Analytics /> straight in the layout, for two
 * reasons: beforeSend is a function, which a Server Component cannot pass, and
 * the decision below needs the pathname.
 *
 * Nothing is loaded under /members. Two of the courses in there tell their
 * readers the opposite of what tracking would mean — the Talk Before You Marry
 * privacy page says in as many words that the course does not use analytics,
 * and its build brief forbids them — and Before You Say Yes is written for
 * people who may be monitored. Dropping the events would not be enough: that
 * page's claim is about analytics being used at all, not about what is sent, so
 * the script is not injected either. This is the same reasoning, and the same
 * usePathname check, that hides the mailing-list form on those pages.
 *
 * The Following Jesus courses under /courses are treated the same way: their
 * instructions say no analytics or tracking on any course route, and the
 * completion page promises that what a learner writes never reaches
 * analytics. Most of those pages are served as whole documents and never pass
 * through this layout; the series home, sign-in and thank-you pages do.
 *
 * Nothing is lost by it. Every funnel event this site records — booking, buying
 * a book, opening a sample, joining, subscribing — happens on a public page.
 *
 * beforeSend stays as the second line: it reduces the URL to its pathname, so a
 * query string cannot carry a token or an email address into a payload by
 * accident, and it drops anything under /members that a client-side navigation
 * might still produce.
 */
export default function VercelAnalytics() {
  const pathname = usePathname();
  if (pathname?.startsWith("/members") || pathname?.startsWith("/courses")) return null;

  return (
    <Analytics
      beforeSend={(event) => {
        let path = event.url;
        try {
          path = new URL(event.url).pathname;
        } catch {
          // Already a path, or unparseable; carry on with what we have.
        }
        if (path.startsWith("/members") || path.startsWith("/courses")) return null;
        return { ...event, url: path };
      }}
    />
  );
}
