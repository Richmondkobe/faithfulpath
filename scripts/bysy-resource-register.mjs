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
//   node scripts/bysy-resource-register.mjs --scan  register against the page

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

/**
 * Entries and findings.
 *
 * An **entry** is a service a reader could contact. A **finding** records a
 * correction, or something that could not be established, about one — and sits
 * directly beneath the entry it concerns, marked with `↳`.
 *
 * The distinction is for the next review rather than for this one: somebody
 * re-checking the page needs to know how many services are on it, not how many
 * rows are in the table. Those numbers differ, and the row count is the larger
 * and the less useful of the two.
 *
 * The emergency-numbers section has findings and no entries, which is correct:
 * its block is out of scope by design, so nothing in it is an entry anybody
 * verified.
 */
export const FINDING_MARK = "↳";

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
    const marked = cells[0].startsWith(FINDING_MARK);
    rows.push({
      section,
      name: marked ? cells[0].slice(FINDING_MARK.length).trim() : cells[0],
      kind: marked ? "finding" : "entry",
      source: cells[1],
      checked: cells[2],
      verified: cells[3],
      status: cells[4],
    });
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

  const entries = rows.filter((r) => r.kind === "entry");
  const findings = rows.filter((r) => r.kind === "finding");
  console.log(`${entries.length} services listed on the page`);
  console.log(`${findings.length} findings recorded about them`);
  console.log(`${rows.length} rows in total\n`);
  for (const [status, n] of Object.entries(byStatus)) {
    const known = status in STATUSES ? "" : "   ← not a recognised status";
    console.log(`  ${String(n).padStart(3)}  ${status}${known}`);
  }

  console.log("\nsections of the resources page (services · findings):");
  for (const s of sections) {
    const e = entries.filter((r) => r.section === s).length;
    const f = findings.filter((r) => r.section === s).length;
    const note = e + f === 0 ? "   ← no register rows" : "";
    console.log(`  ${String(e).padStart(3)} · ${String(f).padEnd(2)} ${s}${note}`);
  }

  const summary = readSummary();
  if (Object.keys(summary).length > 0) {
    console.log("\nthe register's own summary, against its rows:");
    for (const [label, stated] of Object.entries(summary)) {
      const actual = byStatus[label] ?? 0;
      console.log(`  ${label}: states ${stated}, rows give ${actual}${stated === actual ? "" : "   ← disagree"}`);
    }
  }

  if (process.argv.includes("--scan")) {
    // A recorded check is not a changed page. Five findings sat in the register
    // without reaching the page — a correction to StepChange's coverage, two
    // verified numbers, and two regulatory findings — and before them, Kenya's
    // 911, which the page still listed as national.
    //
    // What this compares is exact strings: numbers recorded against numbers
    // printed. A correction phrased in wording the pattern below does not
    // recognise, or an opening time that moved without any digit changing,
    // passes unseen.
    const page = readFileSync(SOURCE, "utf8");
    const digits = (text) => {
      const out = new Map();
      for (const m of text.matchAll(/\+?\d[\d\s().\-–]{3,}\d/g)) {
        const d = m[0].replace(/\D/g, "");
        if (d.length >= 3 && d.length <= 15) out.set(d, m[0].trim());
      }
      return out;
    };
    const pageDigits = digits(page);
    const pageFlat = page.replace(/\D/g, "");

    const absent = [];
    for (const r of rows.filter((x) => x.status === "Verified")) {
      for (const [d, shown] of digits(r.verified)) {
        if (!pageDigits.has(d) && !pageFlat.includes(d)) absent.push({ row: r, shown });
      }
    }
    console.log(`\nverified numbers not found on the page: ${absent.length}`);
    for (const a of absent) console.log(`  ${a.row.name} — ${a.shown}`);

    const CORRECTION = /correct|removed|no longer|instead|rather than|is not\b|not a /i;
    const corrections = rows.filter((r) => r.status === "Verified" && CORRECTION.test(r.verified));
    console.log(`\nrows recording a correction — check each reached the page (${corrections.length}):`);
    for (const r of corrections) console.log(`  ${r.name}\n      ${r.verified.slice(0, 120)}`);
  }

  if (process.argv.includes("--full")) {
    console.log("\nrows not verified:");
    for (const r of rows.filter((x) => x.status !== "Verified")) {
      console.log(`  [${r.status}] ${r.section} — ${r.name}`);
      if (r.verified && r.verified !== "—") console.log(`      ${r.verified}`);
    }
  }
}
