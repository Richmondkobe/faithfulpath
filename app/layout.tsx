import type { Metadata } from "next";
import Link from "next/link";
import { display, sans } from "@/lib/fonts";
import { HELP_PATH, SITE } from "@/lib/site";
import FooterSignup from "@/components/FooterSignup";
import JsonLd from "@/components/JsonLd";
import VercelAnalytics from "@/components/analytics/VercelAnalytics";
import { organizationAndWebSite } from "@/lib/schema";
import SocialLinks from "@/components/SocialLinks";
import AccountLink from "@/components/AccountLink";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://faithfulpathcommunity.com"),
  // Every page's title ends "| Faithful Path Community" from here, rather than
  // each page typing it (website audit S6). A page that must not carry it sets
  // title: { absolute: … }.
  title: {
    // Under about 60 characters, so Google shows it whole (website audit V9;
    // Richmond's wording, 17 October 2026). The share previews keep their
    // longer title.
    default: "Faithful Path Community — Online Pastoral Guidance",
    template: "%s | Faithful Path Community",
  },
  description:
    "Pastoral guidance online with a pastor of twenty years. Articles, teaching, and one-to-one conversations.",
  authors: [{ name: "Richmond Kobe" }],
  openGraph: {
    type: "website",
    siteName: "Faithful Path Community",
    // No url here: a page that inherited it would share as the home page.
    // Each page gives its own through lib/social-meta.ts.
    title: "Faithful Path Community — Online Pastoral Counselling & Spiritual Guidance",
    description:
      "Pastoral guidance online with a pastor of twenty years. Articles, teaching, and one-to-one conversations.",
    images: [
      {
        url: "/og-site.png",
        width: 1200,
        height: 630,
        alt: "Faithful Path Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Faithful Path Community — Online Pastoral Counselling & Spiritual Guidance",
    description:
      "Pastoral guidance online with a pastor of twenty years. Articles, teaching, and one-to-one conversations.",
    images: ["/og-site.png"],
  },
};

// The main menu. `wide` items show only from tablet width up: on a phone the
// site name already goes home, and About and Contact are in the footer, so the
// menu fits on one row under the name (website audit V1, N17). "Sign in" is
// not here: AccountLink shows it, or "My courses" to someone signed in.
const NAV: { href: string; label: string; wide?: boolean }[] = [
  { href: "/", label: "Home", wide: true },
  { href: "/articles", label: "Articles" },
  // The URL stays /guides: the pages, their links and anything already shared
  // are unaffected by what the menu calls them.
  { href: "/guides", label: "Books" },
  // /courses lists the membership's Spiritual Reset and the Following Jesus
  // series side by side; the membership's own page is one click on.
  { href: "/courses", label: "Courses" },
  { href: "/talk-to-a-pastor", label: "Talk to a Pastor" },
  { href: "/about", label: "About", wide: true },
  { href: "/contact", label: "Contact", wide: true },
];

// The footer lists everything, and the membership too (website audit N11).
const FOOTER_NAV = [
  ...NAV.slice(0, 4),
  { href: "/membership", label: "Membership" },
  ...NAV.slice(4),
];

const HEADER_LINK =
  "min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap px-1 text-sun transition-colors hover:text-gold";

// The footer's Legal row. Separate from NAV because these belong at the foot of
// the page only — putting them in the header menu would give them a prominence
// they do not need.
const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/pastoral-terms", label: "Pastoral Conversation Terms" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body
        className="min-h-screen bg-cream text-ink antialiased"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-navy focus:px-5 focus:py-3 focus:text-[15px] focus:font-medium focus:text-sun"
        >
          Skip to main content
        </a>

        {/* Navy, as on the Following Jesus pages. On a phone: the name and
            the account link on one row, the menu on the next, and the tagline
            left for wider screens. */}
        <header className="bg-navy">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex min-h-[44px] flex-col justify-center">
                <span
                  className="block text-xl leading-none text-sun"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                >
                  {SITE.name}
                </span>
                <span className="mt-1.5 hidden text-xs uppercase tracking-[0.16em] text-gold-soft sm:block font-medium">
                  {SITE.tagline}
                </span>
              </Link>
              <AccountLink className={`flex shrink-0 text-[15px] font-semibold sm:hidden ${HEADER_LINK}`} />
            </div>

            {/* Each menu named, so a screen reader can tell them apart. */}
            <nav aria-label="Main" className="-mx-1 flex flex-wrap items-center gap-x-4 gap-y-0 text-[15px] font-semibold">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${item.wide ? "hidden sm:flex" : "flex"} ${HEADER_LINK}`}
                >
                  {item.label}
                </Link>
              ))}
              <AccountLink className={`hidden sm:flex ${HEADER_LINK}`} />
            </nav>
          </div>
        </header>

        {/* Organization and WebSite, once for the site. Every other page
            refers to these by @id rather than repeating them. */}
        <JsonLd data={organizationAndWebSite()} />

        <div id="main" tabIndex={-1}>
          {children}
        </div>

        <footer className="border-t border-line bg-sand">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <FooterSignup />
            <p
              className="text-lg text-navy"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {SITE.name}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Pastoral and spiritual guidance online. Not a substitute for
              therapy, medical care, or emergency services.{" "}
              {/* Help in a crisis, one tap from any page (website audit N3). */}
              <Link
                href={HELP_PATH}
                prefetch={false}
                className="font-semibold text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
              >
                Find help where you live
              </Link>
              .
            </p>
            <nav aria-label="Footer" className="-mx-1 mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {FOOTER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center px-1 text-muted transition-colors hover:text-gold-text"
                >
                  {item.label}
                </Link>
              ))}
              <AccountLink className="flex min-h-[44px] min-w-[44px] items-center justify-center px-1 text-muted transition-colors hover:text-gold-text" />
            </nav>
            {/* Legal, on its own row under the site navigation rather than
                mixed into it: these are pages a reader goes looking for
                deliberately, and burying them among the nav links makes them
                harder to find, not tidier. */}
            <nav
              aria-label="Legal"
              className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
            >
              {LEGAL_LINKS.map((item, i) => (
                <span key={item.href} className="flex items-center gap-x-3">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-muted">
                      ·
                    </span>
                  )}
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center px-1 text-muted transition-colors hover:text-gold-text"
                  >
                    {item.label}
                  </Link>
                </span>
              ))}
            </nav>

            {/* Who the reader is actually buying from. Required on a page that
                takes payment, and the address is the one the legal pages name. */}
            <p className="mt-6 text-sm leading-relaxed text-muted">
              Richmond Kobe, trading as Faithful Path Community, Thailand ·{" "}
              <a
                href="mailto:info@faithfulpathcommunity.com"
                className="text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
              >
                info@faithfulpathcommunity.com
              </a>
            </p>

            <div className="mt-8">
              <SocialLinks />
            </div>
          </div>
        </footer>

        <VercelAnalytics />
      </body>
    </html>
  );
}
