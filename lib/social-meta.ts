import type { Metadata } from "next";

// The share preview (Open Graph and the X/Twitter card) for one page.
//
// Next replaces a page's openGraph and twitter objects wholesale rather than
// merging them with the root layout's, so a page that sets neither inherits
// the home page's title, description and address: shared on WhatsApp or
// Facebook, it shows up as the home page. Every indexable page sets its own
// through this, so the preview always names the page it came from.

const SITE_NAME = "Faithful Path Community";
const DEFAULT_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: SITE_NAME };

export function socialMeta({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
}: {
  title: string;
  description: string;
  /** The page's own address, as its canonical gives it. */
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
