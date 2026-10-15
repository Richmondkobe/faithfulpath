// One-off check: every lesson page and player goes through the site's changes without an error.
import { TBYM_NEW_UNITS, homeHtml, playerHtml, readUnitFile, unitHtml } from "@/lib/tbym-new";
import { writeFileSync, mkdirSync } from "node:fs";
(async () => {
  mkdirSync("/tmp/tbym-new-render", { recursive: true });
  for (const u of TBYM_NEW_UNITS) {
    const page = unitHtml(u, await readUnitFile(u, "page.html"), new Set(u.n % 2 ? [u.slug] : []));
    const player = playerHtml(u, await readUnitFile(u, "player.html"));
    writeFileSync(`/tmp/tbym-new-render/${u.slug}.html`, page);
    writeFileSync(`/tmp/tbym-new-render/${u.slug}-player.html`, player);
    console.log("ok", u.slug, page.length, player.length);
  }
  writeFileSync("/tmp/tbym-new-render/home.html", homeHtml(new Set(["lesson-01", "lesson-02"])));
  console.log("ok home");
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
