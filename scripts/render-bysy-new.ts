// One-off check: every lesson page and player goes through the site's changes without an error.
import { BYSY_NEW_UNITS, homeHtml, playerHtml, readUnitFile, unitHtml } from "@/lib/bysy-new";
import { writeFileSync, mkdirSync } from "node:fs";
(async () => {
  mkdirSync("/tmp/bysy-new-render", { recursive: true });
  for (const u of BYSY_NEW_UNITS) {
    const page = unitHtml(u, await readUnitFile(u, "page.html"), new Set(u.n % 2 ? [u.slug] : []));
    const player = playerHtml(u, await readUnitFile(u, "player.html"));
    writeFileSync(`/tmp/bysy-new-render/${u.slug}.html`, page);
    writeFileSync(`/tmp/bysy-new-render/${u.slug}-player.html`, player);
    console.log("ok", u.slug, page.length, player.length);
  }
  writeFileSync("/tmp/bysy-new-render/home.html", homeHtml(new Set(["lesson-01", "lesson-02"])));
  console.log("ok home");
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
