import type { Metadata } from "next";
import Link from "next/link";
import { socialMeta } from "@/lib/social-meta";

const TITLE = "Install the App";
const DESCRIPTION =
  "Add Faithful Path Community to your phone's home screen, so it opens full screen like an app.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/install" },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: "/install" }),
};

// How to add the site to a phone's home screen (app/manifest.ts). No
// analytics: components/analytics/VercelAnalytics.tsx leaves this page out.
export default function InstallPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 break-words sm:pt-24">
      <Link
        href="/"
        className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
      >
        ← Home
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {TITLE}
      </h1>

      <p className="mt-6 text-[18px] leading-relaxed">
        You can add Faithful Path Community to your phone&apos;s home screen.
        It then opens full screen, like an app, with nothing to download from
        an app store.
      </p>

      <h2
        className="mt-10 text-[1.6rem] leading-snug text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Android
      </h2>
      <p className="mt-3 text-[18px] leading-relaxed">
        Open this site in Chrome. Tap <strong>Install</strong> when it is
        offered, or open the menu (⋮) and tap{" "}
        <strong>Add to Home screen</strong>.
      </p>

      <h2
        className="mt-10 text-[1.6rem] leading-snug text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        iPhone
      </h2>
      <p className="mt-3 text-[18px] leading-relaxed">
        Open this site in Safari. Tap the <strong>Share</strong> button, then{" "}
        <strong>Add to Home Screen</strong>.
      </p>
    </main>
  );
}
