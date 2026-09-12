import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// The completion certificate: one A4 landscape page, generated server-side so
// it cannot be produced without a finished course.
//
// It uses Newsreader — the site's display face — rather than a generic PDF
// serif, so the certificate looks like it came from the same place as the
// course. The files are vendored under assets/fonts (OFL, licence alongside)
// instead of being read out of node_modules, which is not a dependable path
// inside a serverless bundle.

const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

const INK = rgb(0x2b / 255, 0x21 / 255, 0x18 / 255); // #2B2118
const ACCENT = rgb(0x8b / 255, 0x5e / 255, 0x34 / 255); // #8B5E34
const MUTED = rgb(0x6b / 255, 0x5f / 255, 0x53 / 255); // #6B5F53
const CREAM = rgb(0xfd / 255, 0xfa / 255, 0xf4 / 255); // #FDFAF4

type Run = { text: string; font: PDFFont; size: number; color?: ReturnType<typeof rgb> };

function drawCentred(page: PDFPage, runs: Run[], y: number) {
  const width = runs.reduce((w, r) => w + r.font.widthOfTextAtSize(r.text, r.size), 0);
  let x = (A4_LANDSCAPE[0] - width) / 2;
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

export async function buildCertificate({
  name,
  completedOn,
}: {
  name: string;
  completedOn: Date;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fonts = join(process.cwd(), "assets", "fonts");
  const regular = await doc.embedFont(readFileSync(join(fonts, "newsreader-400.woff")), {
    subset: true,
  });
  const italic = await doc.embedFont(
    readFileSync(join(fonts, "newsreader-400-italic.woff")),
    { subset: true }
  );

  const page = doc.addPage(A4_LANDSCAPE);
  const [pageWidth, pageHeight] = A4_LANDSCAPE;

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: CREAM,
  });

  drawTracked(page, "FAITHFUL PATH", pageHeight - 92, 11, regular);

  drawCentred(
    page,
    [{ text: "Certificate of Completion", font: regular, size: 30 }],
    pageHeight - 140
  );

  // The thin accent rule, generous margins either side.
  page.drawRectangle({
    x: pageWidth / 2 - 70,
    y: pageHeight - 166,
    width: 140,
    height: 0.8,
    color: ACCENT,
  });

  drawCentred(
    page,
    [{ text: "This certifies that", font: regular, size: 13, color: MUTED }],
    pageHeight - 218
  );

  // The member's name is the largest thing on the page; shrink it only as far
  // as a long name requires.
  let nameSize = 44;
  const maxNameWidth = pageWidth - 200;
  while (nameSize > 20 && regular.widthOfTextAtSize(name, nameSize) > maxNameWidth) {
    nameSize -= 1;
  }
  drawCentred(page, [{ text: name, font: regular, size: nameSize }], pageHeight - 276);

  drawCentred(
    page,
    [
      { text: "completed ", font: regular, size: 13 },
      { text: "The Christian Spiritual Reset", font: italic, size: 13 },
      { text: ", a guided retreat and 30-day renewal journey,", font: regular, size: 13 },
    ],
    pageHeight - 330
  );

  const date = completedOn.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  drawCentred(page, [{ text: `on ${date}.`, font: regular, size: 13 }], pageHeight - 352);

  drawCentred(
    page,
    [
      {
        text: "One burden entrusted. One responsible step. One person involved. One sustainable rhythm.",
        font: italic,
        size: 12,
        color: MUTED,
      },
    ],
    pageHeight - 412
  );

  drawCentred(page, [{ text: "Richmond Kobe, Pastor", font: regular, size: 13 }], 118);
  drawCentred(
    page,
    [{ text: "faithfulpathcommunity.com", font: regular, size: 11, color: MUTED }],
    98
  );

  return doc.save();
}
