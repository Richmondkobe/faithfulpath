import type { Metadata } from "next";

import LegalPageBody from "@/components/LegalPageBody";
import { readLegal } from "@/lib/legal";

const TITLE = "Terms of Purchase and Use";
const DESCRIPTION =
  "Terms for the books and the Faithful Path membership: prices, delivery, why book sales are final, cancelling, and the seven-day membership refund.";
const PATH = "/terms";

// Read once, at build time — the page is static.
const SOURCE = readLegal("terms");

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

export default function Terms() {
  return <LegalPageBody title={TITLE} source={SOURCE} />;
}
