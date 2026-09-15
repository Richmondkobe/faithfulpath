import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// The two artefacts for "When Your Mind Won't Rest": the foundation
// certificate and the 30-day badge.
//
// Both are generated per request from the member's own record and nothing is
// stored, exactly as the Spiritual Reset certificate works. Both set in
// Newsreader, vendored under assets/fonts.
//
// Neither claims anything it should not. The certificate is of participation
// and completion and implies no accreditation; the badge marks reaching Day 30
// and does not certify that all thirty practices were done, nor any medical or
// therapeutic achievement. The wording comes from course.json so it cannot
// drift from what the course promises.

const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

const INK = rgb(0x2b / 255, 0x21 / 255, 0x18 / 255);
const ACCENT = rgb(0x8b / 255, 0x5e / 255, 0x34 / 255);
const MUTED = rgb(0x6b / 255, 0x5f / 255, 0x53 / 255);
const CREAM = rgb(0xfd / 255, 0xfa / 255, 0xf4 / 255);

type Run = { text: string; font: PDFFont; size: number; color?: ReturnType<typeof rgb> };

function drawCentred(page: PDFPage, runs: Run[], y: number, width = A4_LANDSCAPE[0]) {
  const total = runs.reduce((w, r) => w + r.font.widthOfTextAtSize(r.text, r.size), 0);
  let x = (width - total) / 2;
  for (const run of runs) {
    page.drawText(run.text, { x, y, size: run.size, font: run.font, color: run.color ?? INK });
    x += run.font.widthOfTextAtSize(run.text, run.size);
  }
}

/** Letter-spaced small caps, as the site sets its eyebrow labels. */
function drawTracked(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  tracking = 2.6
) {
  const chars = [...text];
  const width =
    chars.reduce((w, c) => w + font.widthOfTextAtSize(c, size), 0) +
    tracking * (chars.length - 1);
  let x = (A4_LANDSCAPE[0] - width) / 2;
  for (const char of chars) {
    page.drawText(char, { x, y, size, font, color: ACCENT });
    x += font.widthOfTextAtSize(char, size) + tracking;
  }
}

/** Wraps a line of runs to the column, keeping each run's own font. */
function wrapCentred(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  maxWidth: number,
  leading: number,
  color = INK
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  let cursor = y;
  for (const l of lines) {
    drawCentred(page, [{ text: l, font, size, color }], cursor);
    cursor -= leading;
  }
  return cursor;
}

async function newDoc() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const dir = join(process.cwd(), "assets", "fonts");
  const regular = await doc.embedFont(readFileSync(join(dir, "newsreader-400.woff")), {
    subset: true,
  });
  const italic = await doc.embedFont(
    readFileSync(join(dir, "newsreader-400-italic.woff")),
    { subset: true }
  );
  const page = doc.addPage(A4_LANDSCAPE);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4_LANDSCAPE[0],
    height: A4_LANDSCAPE[1],
    color: CREAM,
  });
  return { doc, page, regular, italic };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The foundation certificate.
 *
 * `wording` and `footer` are passed in from course.json rather than written
 * here, so the certificate says exactly what the course map says it says.
 */
export async function buildMindCertificate({
  name,
  wording,
  footer,
  issuedOn,
  notice,
}: {
  name: string;
  wording: string;
  footer: string;
  issuedOn: Date;
  notice: string;
}): Promise<Uint8Array> {
  const { doc, page, regular, italic } = await newDoc();
  const [pageWidth, pageHeight] = A4_LANDSCAPE;

  drawTracked(page, "FAITHFUL PATH", pageHeight - 78, 11, regular);

  drawCentred(
    page,
    [{ text: "Certificate of Participation and Completion", font: regular, size: 26 }],
    pageHeight - 126
  );

  page.drawRectangle({
    x: pageWidth / 2 - 70,
    y: pageHeight - 150,
    width: 140,
    height: 0.8,
    color: ACCENT,
  });

  // The member's name is the largest thing on the page; shrink only as far as a
  // long name needs.
  let nameSize = 40;
  const maxNameWidth = pageWidth - 220;
  while (nameSize > 18 && regular.widthOfTextAtSize(name, nameSize) > maxNameWidth) {
    nameSize -= 1;
  }
  drawCentred(page, [{ text: name, font: regular, size: nameSize }], pageHeight - 214);

  // The manifest's wording, with the member's name substituted into it.
  const body = wording.replace("[Member's Name]", name);
  const after = wrapCentred(
    page,
    body,
    pageHeight - 268,
    13,
    regular,
    pageWidth - 200,
    22,
    INK
  );

  drawCentred(
    page,
    [{ text: formatDate(issuedOn), font: italic, size: 12, color: MUTED }],
    after - 14
  );

  drawCentred(page, [{ text: "Richmond Kobe, Pastor", font: regular, size: 13 }], 132);
  drawCentred(page, [{ text: footer, font: regular, size: 10.5, color: MUTED }], 112);

  // Required on every downloadable PDF, not only on the site.
  wrapCentred(page, notice, 78, 6.5, regular, pageWidth - 140, 9, MUTED);

  return doc.save();
}

/**
 * The 30-day badge.
 *
 * Available once Day 30 has been visited, and careful about what that means:
 * it marks reaching the end of the journey, not completing every practice, and
 * claims nothing medical or therapeutic. Those two sentences are on the
 * artefact itself, not only in the manifest.
 */
export async function buildMindBadge({
  name,
  issuedOn,
  notice,
}: {
  name: string;
  issuedOn: Date;
  notice: string;
}): Promise<Uint8Array> {
  const { doc, page, regular, italic } = await newDoc();
  const [pageWidth, pageHeight] = A4_LANDSCAPE;

  drawTracked(page, "FAITHFUL PATH", pageHeight - 78, 11, regular);

  drawCentred(
    page,
    [{ text: "The 30-Day Mind-Renewal Journey", font: regular, size: 26 }],
    pageHeight - 126
  );

  page.drawRectangle({
    x: pageWidth / 2 - 70,
    y: pageHeight - 150,
    width: 140,
    height: 0.8,
    color: ACCENT,
  });

  let nameSize = 38;
  while (nameSize > 18 && regular.widthOfTextAtSize(name, nameSize) > pageWidth - 220) {
    nameSize -= 1;
  }
  drawCentred(page, [{ text: name, font: regular, size: nameSize }], pageHeight - 212);

  const after = wrapCentred(
    page,
    `${name} reached Day 30 of the Mind-Renewal Journey, walking it at their own pace.`,
    pageHeight - 264,
    13,
    regular,
    pageWidth - 220,
    22
  );

  // Said plainly on the artefact, because a badge is the kind of thing people
  // show to other people.
  wrapCentred(
    page,
    "This marks reaching the end of the journey. It does not certify that all thirty practices were completed, and it is not a medical, therapeutic or professional achievement.",
    after - 18,
    10.5,
    italic,
    pageWidth - 260,
    16,
    MUTED
  );

  drawCentred(
    page,
    [{ text: formatDate(issuedOn), font: italic, size: 12, color: MUTED }],
    150
  );
  drawCentred(
    page,
    [{ text: "Faithful Path Community", font: regular, size: 10.5, color: MUTED }],
    112
  );

  wrapCentred(page, notice, 78, 6.5, regular, pageWidth - 140, 9, MUTED);

  return doc.save();
}
