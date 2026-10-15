import localFont from "next/font/local";

// The site's two faces, self-hosted from fonts/: Source Serif 4 for headings
// and quiet intros, Source Sans 3 for text, the same pair as the Following
// Jesus and lesson pages (website audit Stage 2, navy and gold).
//
// These were loaded through next/font/google, which downloads from Google
// during the build. On 3 October 2026 two of three production deployments
// failed because that download did — a different font each time, on commits
// that touched only a build script. The files are committed instead, and
// scripts/fetch-fonts.mjs is how they are refreshed.
//
// One file per face rather than Google's three-way split by unicode-range,
// because next/font/local's `src` takes only a path, a weight and a style. Each
// file is subset to Basic Latin, Latin-1 Supplement and Latin Extended-A, which
// is a superset of every character the site renders; a character outside it
// falls back per glyph, exactly as it already did for "→" and the Thai in the
// resources page.
//
// Both are variable, so one file covers the whole weight range.
//
// Only fonts every page needs belong here: the root layout imports this file,
// and Next preloads every font declared in it on every page. A course's own
// face goes in a file of its own (lib/fonts-tbym.ts).

export const display = localFont({
  src: [
    { path: "../fonts/site-source-serif-4-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/site-source-serif-4-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
  // A serif face deserves serif metrics for the invisible fallback that holds
  // the space before it loads; the default is Arial.
  adjustFontFallback: "Times New Roman",
});

export const sans = localFont({
  src: [{ path: "../fonts/site-source-sans-3-normal.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});
