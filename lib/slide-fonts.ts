import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

// The slide lecture's two faces, which are not the site's two.
//
// The decks were designed in Source Serif 4 and Source Sans 3 and reviewed in
// them, so the player keeps them rather than being redrawn in Newsreader and
// IBM Plex. They are loaded through next/font, which self-hosts them: the pilot
// pages fetch them from Google on every view, and a members page should not be
// telling a third party which lesson somebody is reading.
//
// The variables are put on the player's own wrapper, so nothing else on the
// page changes face.

export const slideSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-slide-serif",
  display: "swap",
  // Georgia is the pilot's fallback, and close enough in width that the slide
  // does not reflow when the real face arrives.
  fallback: ["Georgia", "serif"],
});

export const slideSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-slide-sans",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

/** Both variables, for the element the player is inside. */
export const slideFontVars = `${slideSerif.variable} ${slideSans.variable}`;
