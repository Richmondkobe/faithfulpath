import localFont from "next/font/local";

// The site's three faces, self-hosted from fonts/.
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
// Newsreader and IBM Plex Sans are variable, so one file covers the whole
// weight range. That is what was being served before: the generated CSS pointed
// weights 300, 400, 500 and 600 at the same file. IBM Plex Mono is not
// variable, so it needs a file per weight.

export const display = localFont({
  src: [
    { path: "../fonts/newsreader-normal.woff2", weight: "300 600", style: "normal" },
    { path: "../fonts/newsreader-italic.woff2", weight: "300 600", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
  // A serif face deserves serif metrics for the invisible fallback that holds
  // the space before it loads; the default is Arial.
  adjustFontFallback: "Times New Roman",
});

export const sans = localFont({
  src: [{ path: "../fonts/ibm-plex-sans-normal.woff2", weight: "400 600", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const tbymMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-tbym-mono",
  display: "swap",
  adjustFontFallback: "Arial",
});
