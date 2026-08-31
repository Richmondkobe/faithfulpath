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
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
