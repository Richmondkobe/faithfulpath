import localFont from "next/font/local";

// IBM Plex Mono, used only by the previous Talk Before You Marry edition's
// layout. In a file of its own so that Next preloads it only there, not on
// every page of the site (lib/fonts.ts is imported by the root layout). It is
// not variable, so it needs a file per weight.
export const tbymMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-tbym-mono",
  display: "swap",
  adjustFontFallback: "Arial",
});
