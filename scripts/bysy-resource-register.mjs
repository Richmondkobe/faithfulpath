// Reads the verification register that §6 requires to live beside the resources
// page, and reports what it does and does not account for.
//
// The register is Markdown, not a data file, because it is written and read by
// people doing the checking. Every row carries a status, and the statuses are
// the point: §6 permits a review date once each entry has been *checked*, and
// "checked" includes finding out that something cannot be established from the
// operator's own source. An entry with a recorded reason is accounted for. An
// entry with no record at all is not.
//
//   node scripts/bysy-resource-register.mjs        what the register accounts for
//   node scripts/bysy-resource-register.mjs --full the full reconciliation

import { readFileSync } from "node:fs";

export const SOURCE = "content/before-you-say-yes-resources-page.md";
export const REGISTER = "content/before-you-say-yes-resources-register.md";

/**
 * The statuses a row may carry.
 *
 * Only `Outstanding` means nobody has looked yet. The other four are all
 * findings — including "out of scope by design", which is the emergency-numbers
 * block: those are presented on the page as a starting point rather than as
 * verified entries, because establishing each one would need a government or
 * regulator source and only press and directory sources exist. Saying so is a
 * decision about the page, not a gap in the review.
 *
 * An unrecognised status fails. A typo, or a status nobody agreed, would
 * otherwise pass silently as though it meant something.
 */
export const STATUSES = {
  "Verified": "checked against the operator's own published information",
  "Outstanding": "not yet checked against the operator's own source",
  "Confirm directly": "public sources do not carry the detail; needs an enquiry to the service",
  "Corrected, not verified to standard": "an error was corrected from evidence, without a full check",
  "Out of scope by design": "presented as a starting point, not verified entry by entry, and the page says so",
};

/** Every row of the register, with the section it sits under. */
export function readRegister(markdown = readFileSync(REGISTER, "utf8")) {
  const rows = [];
  let section = null;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      section = line.slice(3).trim();
      continue;
    }
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-{3,}/.test(line)) continue;
    if (/^\|\s*(Entry|Item)\s*\|/.test(line)) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.length < 5) continue;
    rows.push({ section, name: cells[0], source: cells[1], checked: cells[2], verified: cells[3], status: cells[4] });
  }
  return rows;
}

/** The counts the register states about itself, for checking against its rows. */
export function readSummary(markdown = readFileSync(REGISTER, "utf8")) {
  const out = {};
  const at = markdown.indexOf("## Summary");
  if (at < 0) return out;
  for (const m of markdown.slice(at).matchAll(/^-\s+\*\*([^:*]+):\*\*\s*(\d+)\s*$/gm)) {
    out[m[1].trim()] = Number(m[2]);
  }
  return out;
}

/** The `## sections` of the resources page, in order. */
export function readSections(markdown = readFileSync(SOURCE, "utf8")) {
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => l.slice(3).trim())
    .filter((s) => s !== "A note on this list");
}

if (process.argv[1]?.endsWith("bysy-resource-register.mjs")) {
  const rows = readRegister();
  const sections = readSections();
  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  console.log(`${rows.length} rows in the register\n`);
  for (const [status, n] of Object.entries(byStatus)) {
    const known = status in STATUSES ? "" : "   ← not a recognised status";
    console.log(`  ${String(n).padStart(3)}  ${status}${known}`);
  }

  console.log("\nsections of the resources page:");
  for (const s of sections) {
    const n = rows.filter((r) => r.section === s).length;
    console.log(`  ${String(n).padStart(3)}  ${s}${n === 0 ? "   ← no register rows" : ""}`);
  }

  const summary = readSummary();
  if (Object.keys(summary).length > 0) {
    console.log("\nthe register's own summary, against its rows:");
    for (const [label, stated] of Object.entries(summary)) {
      const actual = byStatus[label] ?? 0;
      console.log(`  ${label}: states ${stated}, rows give ${actual}${stated === actual ? "" : "   ← disagree"}`);
    }
  }

  if (process.argv.includes("--full")) {
    console.log("\nrows not verified:");
    for (const r of rows.filter((x) => x.status !== "Verified")) {
      console.log(`  [${r.status}] ${r.section} — ${r.name}`);
      if (r.verified && r.verified !== "—") console.log(`      ${r.verified}`);
    }
  }
}
