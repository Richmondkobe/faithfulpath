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
        // Not "/guides/*/sample": the samples answer with X-Robots-Tag:
        // noindex, and a crawler can only obey that if it may fetch them.
        // Blocked, a linked sample could still be listed as a bare address
        // (website audit S10).
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
