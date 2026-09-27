import type { NextConfig } from "next";

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
        source: "/pentecostal-denomination-christian-dating",
        destination: "/articles/pentecostal-christian-dating",
        permanent: true,
      },
      {
        source: "/christian-marriage-counseling",
        destination: "/articles/christian-marriage-help-real-problem",
        permanent: true,
      },
      {
        source: "/christian-marriage-retreats",
        destination: "/articles/couples-spiritual-reset-weekend",
        permanent: true,
      },
      {
        source: "/christian-mens-retreat-themes",
        destination: "/articles/christian-mens-retreat-themes",
        permanent: true,
      },
      {
        source: "/christian-dating-and-finances",
        destination: "/articles/money-while-dating",
        permanent: true,
      },
      {
        source: "/baptist-dating",
        destination: "/articles/pentecostal-christian-dating",
        permanent: true,
      },
      {
        source: "/orthodox-dating",
        destination: "/articles/pentecostal-christian-dating",
        permanent: true,
      },
      {
        source: "/anglican-christian-dating",
        destination: "/articles/pentecostal-christian-dating",
        permanent: true,
      },
      {
        source: "/messianic-christian-dating",
        destination: "/articles/pentecostal-christian-dating",
        permanent: true,
      },
      {
        source: "/build-a-growth-mindset-with-biblical-principles",
        destination: "/articles/renewing-your-mind-not-positive-thinking",
        permanent: true,
      },
      // Old service pages that map onto the offer
      {
        source: "/christian-counseling",
        destination: "/talk-to-a-pastor",
        permanent: true,
      },
      {
        source: "/virtual-christian-therapy",
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
    ];
  },
};

export default nextConfig;
