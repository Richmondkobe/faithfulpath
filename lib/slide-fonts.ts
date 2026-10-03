import localFont from "next/font/local";

// The slide lecture's two faces, which are not the site's two.
//
// The decks were designed in Source Serif 4 and Source Sans 3 and reviewed in
// them, so the player keeps them rather than being redrawn in Newsreader and
// IBM Plex. They are served from committed files through next/font/local: the
// pilot pages fetch them from Google on every view, and a members page should
// not be telling a third party which lesson somebody is reading. The files are
// refreshed with scripts/fetch-fonts.mjs.
//
// The variables are put on the player's own wrapper, so nothing else on the
// page changes face.

export const slideSerif = localFont({
  src: [
    { path: "../fonts/source-serif-4-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/source-serif-4-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-slide-serif",
  display: "swap",
  // Georgia is the pilot's fallback, and close enough in width that the slide
  // does not reflow when the real face arrives.
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const slideSans = localFont({
  src: [{ path: "../fonts/source-sans-3-normal.woff2", weight: "400 600", style: "normal" }],
  variable: "--font-slide-sans",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

/** Both variables, for the element the player is inside. */
export const slideFontVars = `${slideSerif.variable} ${slideSans.variable}`;
