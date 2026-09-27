import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/login",
        "/guides/thank-you",
        "/guides/*/claim",
        // The samples are served with X-Robots-Tag: noindex as well. This is
        // the belt to that braces — a crawler that reads robots.txt never
        // fetches them at all.
        "/guides/*/sample",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
