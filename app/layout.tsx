import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
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
  { href: "/talk-to-a-pastor", label: "Talk to a Pastor" },
  { href: "/about", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body
        className="min-h-screen bg-[#FCFCFB] text-[#3E4E58] antialiased"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <header className="border-b border-[#D6DBD8] bg-[#FCFCFB]">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/">
              <span
                className="block text-xl leading-none text-[#17222B]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {SITE.name}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[#2C5651]">
                {SITE.tagline}
              </span>
            </Link>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[#4A5A66] transition-colors hover:text-[#2C5651]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        <footer className="mt-24 border-t border-[#D6DBD8] bg-[#EEF1EF]">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <p
              className="text-lg text-[#17222B]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {SITE.name}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#5A6A73]">
              Pastoral and spiritual guidance online. Not a substitute for
              therapy, medical care, or emergency services.
            </p>
            <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[#4A5A66] transition-colors hover:text-[#2C5651]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
