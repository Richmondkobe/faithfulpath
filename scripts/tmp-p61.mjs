import { extractText, getDocumentProxy } from "unpdf";
import { readFileSync, existsSync } from "node:fs";
const path = "/tmp/pdfs/lead-before-youre-ready.pdf";
if (!existsSync(path)) { console.log("  PDF not on disk"); process.exit(2); }
const pdf = await getDocumentProxy(new Uint8Array(readFileSync(path)));
const { text } = await extractText(pdf, { mergePages: false });
const i = text.findIndex(t => /Concerns,\s*Care and Reporting/i.test(t.replace(/\s+/g," ")));
console.log("  pages:", text.length, "| 'Concerns, Care and Reporting' first appears on p", i+1);
for (const p of [61, 62]) {
  console.log(`\n--- p${p} ---`);
  console.log((text[p-1]||"").replace(/\s+/g," ").trim().slice(0, 1800));
}
