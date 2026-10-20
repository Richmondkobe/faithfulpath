import type { NextConfig } from "next";
import { LBYR_NEW_LIVE, LBYR_OLD_RETIRED } from "./lib/lbyr-new-live";
import { BOOK_CATEGORIES } from "./lib/book-categories";

const BOOK_CATEGORY_SLUGS = BOOK_CATEGORIES.map((c) => c.slug);

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
      // The service worker (public/sw.js): never cached, so a change to it
      // reaches phones on their next visit.
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  // The books store's category filter, /guides?category=<slug>, served from a
  // saved shelf page (app/guides/shelf/[category]) so /guides itself can be
  // saved rather than built on every visit (website audit P3). The address in
  // the browser does not change. Only the four category slugs match; any other
  // value falls through to /guides, which shows the whole store as before.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/guides",
          has: [{ type: "query", key: "category", value: `(?<category>${BOOK_CATEGORY_SLUGS.join("|")})` }],
          destination: "/guides/shelf/:category",
        },
      ],
    };
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
      // The old denomination dating pages: the neutral article on dating across
      // churches and denominations, not the Pentecostal one (website audit
      // N14; Richmond, 17 October 2026).
      {
        source: "/baptist-dating",
        destination: "/articles/what-does-equally-yoked-mean",
        permanent: true,
      },
      {
        source: "/orthodox-dating",
        destination: "/articles/what-does-equally-yoked-mean",
        permanent: true,
      },
      {
        source: "/anglican-christian-dating",
        destination: "/articles/what-does-equally-yoked-mean",
        permanent: true,
      },
      {
        source: "/messianic-christian-dating",
        destination: "/articles/what-does-equally-yoked-mean",
        permanent: true,
      },
      {
        source: "/build-a-growth-mindset-with-biblical-principles",
        destination: "/articles/renewing-your-mind-not-positive-thinking",
        permanent: true,
      },
      // The old Zyro articles, restored as articles (17 October 2026; their
      // bodies and the list are in content/restored-articles/).
      {
        source: "/spiritual-gates-explained",
        destination: "/articles/spiritual-gates-explained",
        permanent: true,
      },
      {
        source: "/aliens-in-the-bible",
        destination: "/articles/aliens-in-the-bible",
        permanent: true,
      },
      {
        source: "/jesus-siblings",
        destination: "/articles/jesus-siblings",
        permanent: true,
      },
      {
        source: "/did-jesus-descend-into-hell",
        destination: "/articles/did-jesus-descend-into-hell",
        permanent: true,
      },
      {
        source: "/predestination-and-free-will",
        destination: "/articles/predestination-and-free-will",
        permanent: true,
      },
      {
        source: "/hidden-gems-lesser-known-parables-of-jesus",
        destination: "/articles/hidden-gems-lesser-known-parables-of-jesus",
        permanent: true,
      },
      {
        source: "/forbidden-fruit-garden-eden",
        destination: "/articles/forbidden-fruit-garden-eden",
        permanent: true,
      },
      {
        source: "/christian-view-of-afterlife",
        destination: "/articles/christian-view-of-afterlife",
        permanent: true,
      },
      {
        source: "/capital-punishment-bible-christians",
        destination: "/articles/capital-punishment-bible-christians",
        permanent: true,
      },
      {
        source: "/can-the-devil-perform-miracles",
        destination: "/articles/can-the-devil-perform-miracles",
        permanent: true,
      },
      {
        source: "/financial-miracle-testimony",
        destination: "/articles/financial-miracle-testimony",
        permanent: true,
      },
      {
        source: "/globalism-in-prophecy",
        destination: "/articles/globalism-in-prophecy",
        permanent: true,
      },
      {
        source: "/wealth-and-prosperity-biblical-truths",
        destination: "/articles/wealth-and-prosperity-biblical-truths",
        permanent: true,
      },
      {
        source: "/can-christians-have-multiple-spiritual-gifts",
        destination: "/articles/can-christians-have-multiple-spiritual-gifts",
        permanent: true,
      },
      {
        source: "/bible-verses-on-technology-advancement",
        destination: "/articles/bible-verses-on-technology-advancement",
        permanent: true,
      },
      {
        source: "/christian-social-media-outreach",
        destination: "/articles/christian-social-media-outreach",
        permanent: true,
      },
      {
        source: "/womens-bible-study-topics",
        destination: "/articles/womens-bible-study-topics",
        permanent: true,
      },
      {
        source: "/did-jesus-descend-into-hell-understanding-the-creed-jesus-descended-into-hell",
        destination: "/articles/did-jesus-descend-into-hell",
        permanent: true,
      },
      {
        source: "/did-jesus-have-siblings-exploring-his-family",
        destination: "/articles/jesus-siblings",
        permanent: true,
      },
      // Old Zyro pages with an article that answers the same question
      // (content/restored-articles/proposed-404-mapping.csv; Richmond,
      // 17 October 2026). The rest of that list is in lib/gone-paths.ts.
      {
        source: "/how-many-spiritual-gifts-are-there-a-biblical-guide",
        destination: "/articles/can-christians-have-multiple-spiritual-gifts",
        permanent: true,
      },
      {
        source: "/bible-support-for-capital-punishment-justice-and-mercy",
        destination: "/articles/capital-punishment-bible-christians",
        permanent: true,
      },
      {
        source: "/is-hell-eternal-or-temporary",
        destination: "/articles/christian-view-of-afterlife",
        permanent: true,
      },
      {
        source: "/spiritual-gifts-test-and-application",
        destination: "/articles/can-christians-have-multiple-spiritual-gifts",
        permanent: true,
      },
      {
        source: "/will-we-have-physical-bodies-in-heaven",
        destination: "/articles/christian-view-of-afterlife",
        permanent: true,
      },
      {
        source: "/is-anxiety-a-spiritual-failure-or-mental-health-issue-anxiety-symptoms",
        destination: "/articles/is-anxiety-a-sin",
        permanent: true,
      },
      {
        source: "/the-essential-guide-to-spiritual-discernment-for-christians",
        destination: "/articles/how-to-hear-gods-voice",
        permanent: true,
      },
      {
        source: "/understanding-severe-old-testament-laws-harsh-punishments",
        destination: "/articles/capital-punishment-bible-christians",
        permanent: true,
      },
      {
        source: "/christian-dating-and-purity",
        destination: "/articles/christian-dating-boundaries",
        permanent: true,
      },
      {
        source: "/transform-your-mind-break-free-from-negative-thoughts",
        destination: "/articles/renewing-your-mind-not-positive-thinking",
        permanent: true,
      },
      {
        source: "/adventist-christian-dating-guide",
        destination: "/articles/what-does-equally-yoked-mean",
        permanent: true,
      },
      {
        source: "/christian-dating-red-flags",
        destination: "/articles/christian-dating-red-flags",
        permanent: true,
      },
      {
        source: "/burnout-in-ministry",
        destination: "/articles/retreat-for-pastors",
        permanent: true,
      },
      {
        source: "/strengthen-marriage-faith-communication",
        destination: "/articles/christian-marriage-help-real-problem",
        permanent: true,
      },
      {
        source: "/discover-your-spiritual-strengths-todayspiritual-gifts-test",
        destination: "/articles/can-christians-have-multiple-spiritual-gifts",
        permanent: true,
      },
      {
        source: "/tithing-vs-generosity",
        destination: "/articles/wealth-and-prosperity-biblical-truths",
        permanent: true,
      },
      {
        source: "/renewing-the-mind-scripture",
        destination: "/articles/renewing-your-mind-not-positive-thinking",
        permanent: true,
      },
      {
        source: "/signs-of-spiritual-growth-recognizing-the-journey-in-faith",
        destination: "/articles/how-do-christians-grow-spiritually",
        permanent: true,
      },
      {
        source: "/multiple-spiritual-gifts",
        destination: "/articles/can-christians-have-multiple-spiritual-gifts",
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
