import type { Metadata } from "next";
import Link from "next/link";
import { display, sans } from "@/lib/fonts";
import { HELP_PATH, SITE, STRIPE_PORTAL_LOGIN_URL } from "@/lib/site";
import FooterCommunityInvite from "@/components/FooterCommunityInvite";
import JsonLd from "@/components/JsonLd";
import VercelAnalytics from "@/components/analytics/VercelAnalytics";
import { organizationAndWebSite } from "@/lib/schema";
import SocialLinks from "@/components/SocialLinks";
import AccountLink from "@/components/AccountLink";
import MobileMenu from "@/components/MobileMenu";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
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
  // Added to an iPhone's home screen, the site opens full screen under this
  // name (app/manifest.ts does the same for Android; the icon is
  // app/apple-icon.png).
  appleWebApp: {
    capable: true,
    title: "Faithful Path",
    statusBarStyle: "black",
  },
  other: { "apple-mobile-web-app-capable": "yes" },
};

// The main menu (Richmond, 26 October 2026): one row on computers, with a
// small gold "Give" button beside "Sign in" / "My account"; a Menu button on
// phones and tablets (components/MobileMenu). The site name goes home. Contact
// is in the footer.
const NAV: { href: string; label: string }[] = [
  { href: "/articles", label: "Articles" },
  // The URL stays /guides: the pages, their links and anything already shared
  // are unaffected by what the menu calls them.
  { href: "/guides", label: "Books" },
  // /courses lists the membership's courses and the Following Jesus series
  // side by side; the membership's own page is one click on.
  { href: "/courses", label: "Courses" },
  { href: "/community", label: "Community" },
  { href: "/talk-to-a-pastor", label: "Talk to a Pastor" },
  { href: "/about", label: "About" },
];

// The footer: three short columns (Richmond, 26 October 2026). The account
// column is added in the markup, as AccountLink chooses its own words.
const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Ministry",
    links: [
      { href: "/about", label: "About" },
      { href: "/community", label: "Community" },
      { href: "/talk-to-a-pastor", label: "Talk to a Pastor" },
      { href: "/give", label: "Give" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/articles", label: "Articles" },
      { href: "/guides", label: "Books" },
      { href: "/courses", label: "Courses" },
      { href: "/community/guidelines", label: "Community Guidelines" },
      { href: HELP_PATH, label: "Help" },
    ],
  },
];

const HEADER_LINK =
  "flex min-h-[44px] items-center whitespace-nowrap px-1 text-sun transition-colors hover:text-gold";
const FOOTER_LINK =
  "flex min-h-[44px] w-fit items-center text-[15px] text-muted transition-colors hover:text-gold-text";

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

        {/* Navy, as on the Following Jesus pages. Computers: the name, the
            menu in one row, then Give and the account link. Phones and
            tablets: the name and a Menu button. */}
        <header className="bg-navy">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-3 lg:flex-nowrap lg:py-5">
            <Link href="/" className="flex min-h-[44px] shrink-0 flex-col justify-center">
              <span
                className="block text-xl leading-none text-sun"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                {SITE.name}
              </span>
              <span className="mt-1.5 hidden text-[13px] font-medium uppercase tracking-[0.12em] text-gold-soft xl:block">
                {SITE.tagline}
              </span>
            </Link>

            {/* Computers. Each menu is named, so a screen reader can tell them apart. */}
            <nav aria-label="Main" className="hidden items-center gap-x-5 text-[15px] font-semibold lg:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className={HEADER_LINK}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="hidden shrink-0 items-center gap-4 text-[15px] font-semibold lg:flex">
              <Link
                href="/give"
                className="flex min-h-[40px] items-center rounded-lg bg-gold px-4 text-night transition-colors hover:bg-gold-soft"
              >
                Give
              </Link>
              <AccountLink className={HEADER_LINK} />
            </div>

            {/* Phones and tablets. */}
            <div className="contents lg:hidden">
              <MobileMenu items={NAV} />
            </div>
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
            <FooterCommunityInvite />
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
            <nav aria-label="Footer" className="mt-8 grid gap-8 sm:grid-cols-3">
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title}>
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-text">{col.title}</h2>
                  <ul className="mt-2">
                    {col.links.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} prefetch={false} className={FOOTER_LINK}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-text">Account</h2>
                <ul className="mt-2">
                  <li>
                    <AccountLink className={FOOTER_LINK} />
                  </li>
                  <li>
                    {/* Stripe's portal login: managing a monthly gift or the
                        membership, from any page (Richmond, 26 October 2026). */}
                    <a href={STRIPE_PORTAL_LOGIN_URL} className={FOOTER_LINK}>
                      Manage my subscription
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
            {/* Legal, on its own row under the site navigation rather than
                mixed into it: these are pages a reader goes looking for
                deliberately, and burying them among the nav links makes them
                harder to find, not tidier. */}
            <nav
              aria-label="Legal"
              className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-6 text-sm"
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

            <Link
              href="/install"
              prefetch={false}
              className="-mx-1 mt-2 inline-flex min-h-[44px] items-center px-1 text-sm text-muted transition-colors hover:text-gold-text"
            >
              Install the app
            </Link>

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
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
