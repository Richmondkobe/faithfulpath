import type { Metadata } from "next";

import LegalPageBody from "@/components/LegalPageBody";
import { readLegal } from "@/lib/legal";

const TITLE = "Pastoral Conversation Terms";
const DESCRIPTION =
  "What a Talk to a Pastor session is and is not, how confidentiality works, and the rules on booking, rescheduling and cancelling.";
const PATH = "/pastoral-terms";

// Read once, at build time — the page is static.
const SOURCE = readLegal("pastoral-terms");

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

export default function PastoralTerms() {
  return <LegalPageBody title={TITLE} source={SOURCE} />;
}
