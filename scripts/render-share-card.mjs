// Draws the site's general share card with lib/share-card.tsx, the same look
// as the article cards, and writes it as a PNG.
//
//   npx tsx scripts/render-share-card.mjs public/og-site.png
//
// A new file name rather than over og-default.png: social sites keep a copy
// of a share image under its address, so a changed picture needs a new one.
import { writeFileSync } from "node:fs";
import { shareCard } from "../lib/share-card.tsx";

const out = process.argv[2];
if (!out) throw new Error("Usage: npx tsx scripts/render-share-card.mjs <file.png>");
const card = await shareCard({ title: "Faithful Path Community", footer: false });
writeFileSync(out, Buffer.from(await card.arrayBuffer()));
console.log(`written ${out}`);
