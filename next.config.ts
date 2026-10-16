import type { NextConfig } from "next";
import { LBYR_NEW_LIVE, LBYR_OLD_RETIRED } from "./lib/lbyr-new-live";

// Guide covers are served from the public Supabase storage bucket.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// What the site's pages may load, and where their forms may go. Inline
// scripts and styles are allowed because Next.js and the course pages use
// them. Supabase serves the covers and course recordings and handles sign-in;
// Stripe is reached only as a page the browser is sent on to after a form.
const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : "";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `media-src 'self' blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseHost ? `wss://${supabaseHost}` : ""}`,
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Guide PDFs go through the saveProduct action, and the default cap is
      // 1MB — far too small for a real guide plus its cover.
      bodySizeLimit: "25mb",
    },
  },
  // The Following Jesus pages and their fonts are read from disk at request
  // time. The tracer usually finds files read through process.cwd(), but these
  // routes serve nothing else, so say so rather than rely on it.
  outputFileTracingIncludes: {
    "/courses/following-jesus/**/*": ["./content/courses/following-jesus/**/*.html"],
    "/courses/following-jesus/fonts/*": ["./fonts/fj-*.woff2", "./fonts/lbyr-*.woff2"],
    // The new Reset edition (hidden test course): its pages and PDFs.
    "/members/courses/christian-spiritual-reset-new/**/*": ["./content/courses/christian-spiritual-reset-new/**/*"],
    // The new Before You Say Yes edition (hidden test course): its pages.
    "/members/courses/before-you-say-yes-new/**/*": ["./content/courses/before-you-say-yes-new/**/*"],
    // The new Talk Before You Marry edition (hidden test course): its pages.
    "/members/courses/talk-before-you-marry-new/**/*": ["./content/courses/talk-before-you-marry-new/**/*"],
    // The new Lead Before You're Ready edition (hidden test course): its pages.
    "/members/courses/lead-before-youre-ready-new/**/*": ["./content/courses/lead-before-youre-ready-new/**/*"],
  },
  images: {
    // Keep resized images for 31 days rather than the default 4 hours. A book
    // cover's file name carries its upload time (lib/storage.ts), so a new
    // cover is a new address and is never hidden behind an old copy. The same
    // goes for anything in public/: replace an image under a new file name.
    minimumCacheTTL: 2678400,
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
  // No "X-Powered-By: Next.js" on every response.
  poweredByHeader: false,
  // Security headers for every page (website audit X4). SAMEORIGIN rather than
  // DENY: the course pages frame their own players from this site.
  //
  // The Content Security Policy is report-only for now (Richmond, 15 October
  // 2026): browsers note in their console anything it would have blocked, and
  // block nothing. Once a few weeks pass with no unexpected reports, the same
  // policy can move to "Content-Security-Policy" to be enforced.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
          { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Finding Help Where You Live moved from the Before You Say Yes address
      // to one that suits every course (Richmond, 15 October 2026).
      {
        source: "/before-you-say-yes/resources",
        destination: "/help",
        permanent: true,
      },
      // Retired course editions, whose pages have been removed: every old
      // address, bookmarks and emails included, opens the current edition.
      // Their members' progress rows are untouched.
      {
        source: "/members/courses/talk-before-you-marry/:path*",
        destination: "/members/courses/talk-before-you-marry-new",
        permanent: true,
      },
      {
        source: "/members/courses/before-you-say-yes/:path*",
        destination: "/members/courses/before-you-say-yes-new",
        permanent: true,
      },
      // Lead Before You're Ready, September edition: retired, but its pages are
      // kept and can come back (lib/lbyr-new-live.ts), so these are temporary
      // redirects that no browser remembers. Its Concerns page opens the new
      // Concerns page; everything else opens the new course page.
      ...(LBYR_NEW_LIVE && LBYR_OLD_RETIRED
        ? [
            {
              source: "/members/courses/lead-before-youre-ready/concerns-care-and-reporting",
              destination: "/members/courses/lead-before-youre-ready-new/concerns-care-and-reporting",
              permanent: false,
            },
            {
              source: "/members/courses/lead-before-youre-ready/:path*",
              destination: "/members/courses/lead-before-youre-ready-new",
              permanent: false,
            },
          ]
        : []),
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
