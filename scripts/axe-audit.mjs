#!/usr/bin/env node
//
// Accessibility audit of the public pages, with axe-core in a real browser.
//
//   node scripts/axe-audit.mjs                     # against production
//   node scripts/axe-audit.mjs --base http://localhost:3100
//   node scripts/axe-audit.mjs --json /tmp/before.json
//
// Ten pages at two widths. The mobile width is 375px because that is an iPhone
// SE and the narrowest thing worth supporting; the desktop one is 1280px.
//
// Tap targets are checked separately from axe. Its own target-size rule is
// still experimental and off by default, and the 44px figure below is the
// Apple/WCAG 2.2 AA number rather than axe's 24px minimum.

import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const BASE = (arg("--base", "https://faithfulpathcommunity.com")).replace(/\/$/, "");
const JSON_OUT = arg("--json", null);

const PATHS = [
  "/",
  "/articles",
  "/articles/signs-of-spiritual-burnout",
  "/guides",
  "/guides/talk-before-you-marry",
  "/membership",
  "/talk-to-a-pastor",
  "/about",
  "/contact",
  "/privacy",
];

const WIDTHS = [
  { name: "desktop", viewport: { width: 1280, height: 900 } },
  { name: "mobile", viewport: { width: 375, height: 812 } },
];

/** Elements that should be at least 44x44 for a finger. */
const TAP_TARGET_JS = `(() => {
  const MIN = 44;
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button]')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    // A visually-hidden control — the skip link before it is focused — is 1x1
    // by design and becomes full size when it matters. Measuring it hidden
    // reports a target nobody is trying to tap.
    if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // A link inside a paragraph is text, not a control; the rule is for
    // things a finger aims at, so inline links in running prose are skipped.
    const inProse = el.tagName === 'A' && ['P','LI','SPAN','STRONG','EM','DD','DT'].includes(el.parentElement?.tagName ?? '');
    if (inProse) continue;
    if (r.width >= MIN && r.height >= MIN) continue;
    const label = (el.textContent ?? '').replace(/\\s+/g, ' ').trim().slice(0, 48) || el.getAttribute('aria-label') || el.tagName;
    const key = label + Math.round(r.width) + 'x' + Math.round(r.height);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName.toLowerCase() });
  }
  return out;
})()`;

const browser = await chromium.launch();
const results = [];
const tapIssues = [];
const failures = [];
let axeChecked = 0;
let tapChecked = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    viewport: width.viewport,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  for (const path of PATHS) {
    const url = `${BASE}${path}`;
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      const status = response?.status() ?? 0;
      const title = await page.title();
      if (status >= 400 || /Security Checkpoint/i.test(title)) {
        console.error(`  ! ${path} [${width.name}] returned ${status} "${title}" — skipped`);
        continue;
      }
      await page.waitForTimeout(400);

      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      for (const v of axe.violations) {
        results.push({
          rule: v.id,
          impact: v.impact,
          help: v.help,
          path,
          width: width.name,
          nodes: v.nodes.map((n) => ({
            target: n.target.join(" "),
            html: n.html.replace(/\s+/g, " ").slice(0, 140),
          })),
        });
      }

      if (width.name === "mobile") {
        const found = await page.evaluate(TAP_TARGET_JS);
        if (!Array.isArray(found)) {
          throw new Error(
            `tap-target check returned ${typeof found}, not an array — an empty result here would read as a pass`
          );
        }
        for (const t of found) tapIssues.push({ path, ...t });
        tapChecked++;
      }
      axeChecked++;
    } catch (err) {
      failures.push(`${path} [${width.name}]: ${err.message.split("\n")[0]}`);
      console.error(`  ! ${path} [${width.name}] failed: ${err.message.split("\n")[0]}`);
    }
  }
  await context.close();
}
await browser.close();

/* ------------------------------- report ------------------------------- */
const byRule = new Map();
for (const r of results) {
  if (!byRule.has(r.rule)) byRule.set(r.rule, []);
  byRule.get(r.rule).push(r);
}

const totalNodes = results.reduce((n, r) => n + r.nodes.length, 0);
console.log(`\n  ${BASE}`);
console.log(`  ${PATHS.length} pages x ${WIDTHS.length} widths`);
console.log(`  ${byRule.size} rule(s) violated, ${results.length} page-instances, ${totalNodes} element(s)\n`);

const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
for (const [rule, list] of [...byRule].sort(
  (a, b) => (order[a[1][0].impact] ?? 9) - (order[b[1][0].impact] ?? 9)
)) {
  const impact = list[0].impact ?? "n/a";
  const nodes = list.reduce((n, r) => n + r.nodes.length, 0);
  console.log(`  ${rule}  [${impact}]  ${nodes} element(s)`);
  console.log(`     ${list[0].help}`);
  const where = new Map();
  for (const r of list) {
    for (const n of r.nodes) {
      const key = `${r.path} (${r.width})`;
      if (!where.has(key)) where.set(key, new Set());
      where.get(key).add(n.html);
    }
  }
  for (const [place, htmls] of where) {
    console.log(`     ${place}`);
    for (const h of [...htmls].slice(0, 3)) console.log(`        ${h}`);
    if (htmls.size > 3) console.log(`        … and ${htmls.size - 3} more`);
  }
  console.log();
}

if (tapIssues.length) {
  const seen = new Map();
  for (const t of tapIssues) {
    const key = `${t.label} ${t.w}x${t.h}`;
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key).add(t.path);
  }
  console.log(`  tap targets under 44px at 375px: ${seen.size} distinct\n`);
  for (const [what, paths] of seen) {
    console.log(`     ${what}`);
    console.log(`        ${[...paths].join(", ")}`);
  }
  console.log();
} else {
  console.log("  tap targets: nothing under 44px at 375px\n");
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, results, tapIssues }, null, 1));
  console.log(`  written to ${JSON_OUT}\n`);
}

console.log(
  `  coverage  axe:${axeChecked}/${PATHS.length * WIDTHS.length} page-views  ` +
    `tap:${tapChecked}/${PATHS.length} mobile pages`
);
if (failures.length) {
  console.log(`\n  ${failures.length} check(s) did not run:`);
  for (const f of failures) console.log(`     ${f}`);
}
console.log(`\n  TOTALS  rules:${byRule.size}  elements:${totalNodes}  tap:${tapIssues.length}\n`);
if (axeChecked < PATHS.length * WIDTHS.length || tapChecked < PATHS.length) {
  console.log("  INCOMPLETE — the totals above do not cover every page.\n");
  process.exitCode = 1;
}
