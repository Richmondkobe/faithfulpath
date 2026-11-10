#!/usr/bin/env node
// Tell Bing (and the other IndexNow search engines) that pages have changed,
// so they re-read them now instead of whenever they next visit.
//
//   node scripts/indexnow.mjs                 # every URL in the live sitemap
//   node scripts/indexnow.mjs /guides/x /y   # just these paths (or full URLs)
//
// The key is the public/<key>.txt file in this repo (IndexNow checks it is
// served at the site root). It is not a secret: anyone can read that file.
import fs from "node:fs";
import path from "node:path";

const SITE = process.env.INDEXNOW_SITE ?? "https://faithfulpathcommunity.com";
const publicDir = path.join(process.cwd(), "public");
const keyFile = fs.readdirSync(publicDir).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file (32 hex characters + .txt) found in public/.");
const key = keyFile.replace(/\.txt$/, "");

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`Could not read ${SITE}/sitemap.xml (HTTP ${res.status}).`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const args = process.argv.slice(2);
const urls = args.length
  ? args.map((a) => (a.startsWith("http") ? a : `${SITE}${a.startsWith("/") ? "" : "/"}${a}`))
  : await sitemapUrls();

// Check the key file is live before submitting, so a failure is explained.
const keyCheck = await fetch(`${SITE}/${keyFile}`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== key) {
  throw new Error(`${SITE}/${keyFile} is not live yet. Push and wait for the deploy, then run this again.`);
}

const host = new URL(SITE).host;
for (let i = 0; i < urls.length; i += 10000) {
  const urlList = urls.slice(i, i + 10000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
  });
  // 200 = accepted; 202 = accepted, key still being validated.
  console.log(`IndexNow: ${urlList.length} URLs -> HTTP ${res.status}${res.ok ? " (accepted)" : ` ${await res.text()}`}`);
  if (!res.ok) process.exitCode = 1;
}
