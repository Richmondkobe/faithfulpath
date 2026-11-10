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
 * /install, the page on adding the site to a home screen, is left out too
 * (Richmond, 21 October 2026: no analytics on that page).
 *
 * beforeSend stays as the second line: it removes the query string and
 * fragment, so neither can carry a token or an email address into a payload by
 * accident, and it drops anything under /members that a client-side navigation
 * might still produce. It keeps the URL absolute (origin + path): from
 * 27 September to 10 November 2026 it sent a bare path, which Vercel rejects,
 * so no page view or event was ever recorded.
 */
export default function VercelAnalytics() {
  const pathname = usePathname();
  if (pathname?.startsWith("/members") || pathname?.startsWith("/courses") || pathname === "/install") return null;

  return (
    <Analytics
      beforeSend={(event) => {
        // Vercel rejects any event whose url is not absolute (400, "body/o
        // must match pattern ^https?://"), so the url must stay a full
        // address. Strip the query string and fragment, keep the origin.
        let url: URL;
        try {
          url = new URL(event.url, window.location.origin);
        } catch {
          return null; // Unparseable: send nothing rather than guess.
        }
        const path = url.pathname;
        if (path.startsWith("/members") || path.startsWith("/courses") || path === "/install") return null;
        url.search = "";
        url.hash = "";
        return { ...event, url: url.href };
      }}
    />
  );
}
