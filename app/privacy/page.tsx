import type { Metadata } from "next";

import LegalPageBody from "@/components/LegalPageBody";
import { readLegal } from "@/lib/legal";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "What Faithful Path Community collects, why, where it is kept and how long for — and the confidentiality of pastoral conversations.";
const PATH = "/privacy";

// Read once, at build time — the page is static.
const SOURCE = readLegal("privacy");

export const metadata: Metadata = {
  title: `${TITLE} | Faithful Path Community`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "article",
    url: PATH,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Faithful Path Community",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export default function Privacy() {
  return <LegalPageBody title={TITLE} source={SOURCE} />;
}
