import type { NextConfig } from "next";

// Old Zyro URLs that still have traffic or impressions in Google.
// Each one now points somewhere sensible on the new site.
// As articles get rewritten, change the destination to the new article.
const OLD_PATHS = [
  "christian-mens-retreat-themes",
  "pentecostal-denomination-christian-dating",
  "hidden-gems-lesser-known-parables-of-jesus",
  "christian-dating-and-finances",
  "orthodox-dating",
  "financial-miracle-testimony",
  "spiritual-gates-explained",
  "understanding-john-653-56-eat-my-flesh-drink-my-blo",
  "baptist-dating",
  "christian-mental-health-podcasts",
  "globalism-in-prophecy",
  "can-christians-have-multiple-spiritual-gifts",
  "christian-social-media-outreach",
  "bible-verses-on-technology-advancement",
  "christian-dating-apps",
  "fruits-vs-gifts-of-the-holy-spirit-explained-fruits",
  "messianic-christian-dating",
  "anglican-christian-dating",
  "can-the-devil-perform-miracles",
  "christian-dating-and-long-distance",
  "build-a-growth-mindset-with-biblical-principles",
  "can-satan-be-forgiven",
  "1-timothy-5-17-18-explained",
  "mark-823-symbolism",
  "youth-ministry-lessons-parables",
  "the-minor-prophets",
  "lower-cholesterol-christian-guide",
  "womens-bible-study-topics",
  "wealth-and-prosperity-biblical-truths",
  "aliens-in-the-bible",
  "what-does-the-bible-say-about-masturbation",
  "jesus-siblings",
  "forbidden-fruit-garden-eden",
  "capital-punishment-bible-christians",
  "did-jesus-descend-into-hell",
  "christian-view-of-afterlife",
  "predestination-and-free-will",
  "virtual-christian-therapy",
];

// Guide covers are served from the public Supabase storage bucket.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Guide PDFs go through the saveProduct action, and the default cap is
      // 1MB — far too small for a real guide plus its cover.
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async redirects() {
    return [
      // Pages whose topic maps directly onto an existing new article
      {
        source: "/christian-leadership-training",
        destination: "/articles/christian-leadership-training",
        permanent: true,
      },
      {
        source: "/christian-marriage-counseling",
        destination: "/articles/christian-marriage-help-real-problem",
        permanent: true,
      },
      {
        source: "/christian-marriage-retreats",
        destination: "/articles/christian-marriage-help-real-problem",
        permanent: true,
      },
      // Old service pages that map onto the offer
      {
        source: "/christian-counseling",
        destination: "/talk-to-a-pastor",
        permanent: true,
      },
      {
        source: "/the-founder",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/faith-path-blog",
        destination: "/articles",
        permanent: true,
      },
      // Everything else with search history goes to the articles index for now
      ...OLD_PATHS.map((p) => ({
        source: `/${p}`,
        destination: "/articles",
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
