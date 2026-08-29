import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import SignupForm from "@/components/SignupForm";
import SocialLinks from "@/components/SocialLinks";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Faithful Path Community — Online Christian Counselling & Spiritual Guidance",
  description:
    "Pastoral guidance online with a pastor of twenty years. Articles, teaching, and one-to-one conversations.",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Articles" },
  { href: "/guides", label: "Guides" },
  { href: "/talk-to-a-pastor", label: "Talk to a Pastor" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body
        className="min-h-screen bg-[#FDFAF4] text-[#4A4038] antialiased"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <MetaPixel />

        <header className="border-b border-[#E5D9C7] bg-[#FDFAF4]">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/">
              <span
                className="block text-xl leading-none text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {SITE.name}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[#8B5E34]">
                {SITE.tagline}
              </span>
            </Link>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[#5C5147] transition-colors hover:text-[#8B5E34]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t border-[#E5D9C7] bg-[#F3EADC]">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="mb-10 border-b border-[#E5D9C7] pb-10">
              <SignupForm />
            </div>
            <p
              className="text-lg text-[#2B2118]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {SITE.name}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6B5F53]">
              Pastoral and spiritual guidance online. Not a substitute for
              therapy, medical care, or emergency services.
            </p>
            <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[#5C5147] transition-colors hover:text-[#8B5E34]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8">
              <SocialLinks />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
