// Builds the verification register that §6 requires to live beside the source
// file rather than in the rendered page.
//
// The register is a list of every entry on the resources page and, for each,
// the checks §6 names: contact method, official website, intended audience and
// country, hours/language/cost claims, what kind of service it is, whether it
// still describes itself as operating, and the date and source used.
//
// This script does not perform those checks and cannot. It builds the register
// from the source file and carries forward whatever has already been recorded
// against each entry, leaving the rest marked "not recorded". A field filled in
// by a script would be a claim that somebody checked a helpline when nobody
// did, and the people who need these numbers are in no position to discover
// otherwise.
//
//   node scripts/bysy-resource-register.mjs          report what is missing
//   node scripts/bysy-resource-register.mjs --write  refresh the register file

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SOURCE = "content/before-you-say-yes-resources-page.md";
const REGISTER = "content/before-you-say-yes-resources-verification.json";

const FIELDS = [
  "contact_method",
  "official_website",
  "audience_and_country",
  "hours_language_cost",
  "service_type",
  "still_operating",
  "checked_on",
  "source_used",
];

export function readEntries(markdown) {
  const entries = [];
  let section = null;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      section = line.slice(3).trim();
      continue;
    }
    if (!section || section === "A note on this list") continue;
    const trimmed = line.trim();
    if (!/^(\*\*|\*[A-Z]|- )/.test(trimmed) || !trimmed.includes(":")) continue;
    const name = trimmed
      .replace(/^[-*\s]+/, "")
      .split(":")[0]
      .replace(/\*+/g, "")
      .trim();
    if (name) entries.push({ section, name });
  }
  return entries;
}

const entries = readEntries(readFileSync(SOURCE, "utf8"));
const existing = existsSync(REGISTER) ? JSON.parse(readFileSync(REGISTER, "utf8")) : { entries: [] };
const byKey = new Map(existing.entries.map((e) => [`${e.section}::${e.name}`, e]));

const merged = entries.map(({ section, name }) => {
  const prior = byKey.get(`${section}::${name}`) ?? {};
  const record = { section, name };
  for (const f of FIELDS) record[f] = prior[f] ?? "not recorded";
  if (prior.note) record.note = prior.note;
  return record;
});

const out = {
  about:
    "Verification metadata for content/before-you-say-yes-resources-page.md, per build notes §6. " +
    "A 'last reviewed' date may only be shown once a human has checked each entry against an " +
    "authoritative source. This file is that record. 'not recorded' means no evidence has been " +
    "filed here — not that the entry is wrong, and not that it was checked.",
  source: SOURCE,
  fields: FIELDS,
  outstanding: existing.outstanding ?? [],
  entries: merged,
};

const unrecorded = merged.filter((e) => FIELDS.some((f) => e[f] === "not recorded"));
if (process.argv.includes("--write")) {
  writeFileSync(REGISTER, JSON.stringify(out, null, 2) + "\n");
  console.log(`wrote ${REGISTER}: ${merged.length} entries, ${unrecorded.length} with fields not recorded`);
} else {
  console.log(`${merged.length} entries on the resources page`);
  console.log(`${unrecorded.length} have at least one field not recorded`);
  const added = merged.filter((e) => !byKey.has(`${e.section}::${e.name}`));
  if (added.length > 0) {
    console.log(`\n${added.length} entry(ies) on the page with no record at all:`);
    for (const e of added) console.log(`  ${e.section} — ${e.name}`);
  }
}
