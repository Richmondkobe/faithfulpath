import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { journalDate, type Journal } from "@/lib/journal";

// The member's journal as a PDF, generated server-side from their own rows.
//
// Like the certificate it sets in Newsreader, the site's display face, vendored
// under assets/fonts rather than read out of node_modules — that path is not
// dependable inside a serverless bundle. Unlike the certificate this is a
// flowing document, so everything here is about wrapping and page breaks.

const A4: [number, number] = [595.28, 841.89];
const [PAGE_W, PAGE_H] = A4;

const MARGIN_X = 64;
const TOP = PAGE_H - 72;
const BOTTOM = 72;
const COLUMN = PAGE_W - MARGIN_X * 2;

const INK = rgb(0x2b / 255, 0x21 / 255, 0x18 / 255); // #2B2118
const ACCENT = rgb(0x8b / 255, 0x5e / 255, 0x34 / 255); // #8B5E34
const MUTED = rgb(0x6b / 255, 0x5f / 255, 0x53 / 255); // #6B5F53
const RULE = rgb(0xe5 / 255, 0xd9 / 255, 0xc7 / 255); // #E5D9C7
const CREAM = rgb(0xfd / 255, 0xfa / 255, 0xf4 / 255); // #FDFAF4

type Fonts = { regular: PDFFont; italic: PDFFont };

/**
 * A pen that writes down one page and starts another when it runs out of room.
 * Every draw goes through this so nothing has to track y itself.
 */
class Flow {
  private page: PDFPage;
  private y: number;
  readonly pages: PDFPage[] = [];

  constructor(
    private doc: PDFDocument,
    private fonts: Fonts
  ) {
    this.page = this.newPage();
    this.y = TOP;
  }

  private newPage(): PDFPage {
    const page = this.doc.addPage(A4);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: CREAM });
    this.pages.push(page);
    return page;
  }

  /** Starts a new page unless `need` points still fit below the current line. */
  private ensure(need: number) {
    if (this.y - need >= BOTTOM) return;
    this.page = this.newPage();
    this.y = TOP;
  }

  space(points: number) {
    // Never carry blank space onto the top of a fresh page.
    if (this.y - points < BOTTOM) return;
    this.y -= points;
  }

  /** Splits `text` into lines that fit the column at this size. */
  private wrap(text: string, font: PDFFont, size: number): string[] {
    const lines: string[] = [];
    // Honour the member's own paragraph breaks before wrapping each one.
    for (const paragraph of text.split(/\r?\n/)) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of trimmed.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= COLUMN) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        // A single word longer than the column — break it rather than overflow.
        if (font.widthOfTextAtSize(word, size) > COLUMN) {
          let chunk = "";
          for (const char of word) {
            if (font.widthOfTextAtSize(chunk + char, size) > COLUMN) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk += char;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  text(
    content: string,
    {
      size = 11,
      leading = 16,
      font = this.fonts.regular,
      color = INK,
      indent = 0,
    }: {
      size?: number;
      leading?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
      indent?: number;
    } = {}
  ) {
    for (const line of this.wrap(content, font, size)) {
      if (!line) {
        this.space(leading * 0.6);
        continue;
      }
      this.ensure(leading);
      this.y -= leading;
      this.page.drawText(line, {
        x: MARGIN_X + indent,
        y: this.y,
        size,
        font,
        color,
      });
    }
  }

  /** Letter-spaced small caps, as the site sets its eyebrow labels. */
  tracked(text: string, size = 8.5, tracking = 2, color = ACCENT) {
    this.ensure(size + 6);
    this.y -= size + 4;
    let x = MARGIN_X;
    for (const char of text.toUpperCase()) {
      this.page.drawText(char, {
        x,
        y: this.y,
        size,
        font: this.fonts.regular,
        color,
      });
      x += this.fonts.regular.widthOfTextAtSize(char, size) + tracking;
    }
  }

  rule(width = COLUMN, color = RULE) {
    this.ensure(10);
    this.y -= 8;
    this.page.drawRectangle({
      x: MARGIN_X,
      y: this.y,
      width,
      height: 0.8,
      color,
    });
  }

  /**
   * Keeps a block together: if `need` points are not left, break first, so a
   * lesson heading never sits alone at the foot of a page.
   */
  keepTogether(need: number) {
    this.ensure(need);
  }
}

export async function buildJournalPdf({
  journals,
  memberEmail,
}: {
  /** One per course the member has written in, in the order they appear. */
  journals: Journal[];
  memberEmail: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const dir = join(process.cwd(), "assets", "fonts");
  const fonts: Fonts = {
    regular: await doc.embedFont(readFileSync(join(dir, "newsreader-400.woff")), {
      subset: true,
    }),
    italic: await doc.embedFont(
      readFileSync(join(dir, "newsreader-400-italic.woff")),
      { subset: true }
    ),
  };

  const flow = new Flow(doc, fonts);

  /* ------------------------------------------------------------- heading */

  const entryCount = journals.reduce((n, j) => n + j.entryCount, 0);
  const lastWritten = journals
    .map((j) => j.lastWrittenAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1) ?? null;

  flow.tracked("Faithful Path");
  flow.space(12);
  flow.text("Your journal", { size: 26, leading: 32 });
  flow.space(4);
  flow.text(
    journals.map((j) => j.courseTitle).join(" · "),
    { size: 13, leading: 18, font: fonts.italic, color: MUTED }
  );
  flow.space(10);
  flow.rule();
  flow.space(14);

  const printed = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const last = journalDate(lastWritten);
  flow.text(memberEmail, { size: 9.5, leading: 13, color: MUTED });
  flow.text(
    last
      ? `${entryCount} reflection${entryCount === 1 ? "" : "s"} · last written ${last} · printed ${printed}`
      : `Printed ${printed}`,
    { size: 9.5, leading: 13, color: MUTED }
  );

  if (journals.every((j) => j.modules.length === 0)) {
    flow.space(28);
    flow.text(
      "You have not written anything in your journal yet. Your reflections will appear here once you begin the course.",
      { size: 11, leading: 17, font: fonts.italic, color: MUTED }
    );
    return doc.save();
  }

  /* ------------------------------------------------- modules and lessons */

  for (const journal of journals) {
    if (journal.modules.length === 0) continue;

    flow.space(34);
    flow.keepTogether(90);
    flow.text(journal.courseTitle, { size: 19, leading: 25 });
    flow.space(4);
    flow.rule();

  for (const mod of journal.modules) {
    flow.space(30);
    flow.keepTogether(96);
    flow.tracked("Module");
    flow.space(6);
    flow.text(mod.title, { size: 17, leading: 23 });
    flow.space(6);
    flow.rule();

    for (const lesson of mod.lessons) {
      flow.space(22);
      // Enough room for the lesson title, its date and a first line of answer.
      flow.keepTogether(88);

      flow.text(`${lesson.order}. ${lesson.title}`, { size: 13, leading: 19 });

      const written = journalDate(lesson.lastWrittenAt);
      if (written) {
        flow.space(2);
        flow.text(written, { size: 9, leading: 12, color: MUTED, font: fonts.italic });
      }

      for (const entry of lesson.answers) {
        flow.space(12);
        flow.keepTogether(46);
        flow.text(entry.prompt, {
          size: 10.5,
          leading: 15,
          font: fonts.italic,
          color: ACCENT,
        });
        flow.space(3);
        flow.text(entry.answer, { size: 11, leading: 16.5 });
      }

      if (lesson.nextStep) {
        const step = lesson.nextStep;
        flow.space(12);
        flow.keepTogether(46);
        flow.text("Your next step", {
          size: 10.5,
          leading: 15,
          font: fonts.italic,
          color: ACCENT,
        });
        flow.space(3);
        flow.text(step.action, { size: 11, leading: 16.5 });

        const doneOn = journalDate(step.doneAt);
        if (step.done) {
          flow.space(3);
          flow.text(doneOn ? `Marked done on ${doneOn}.` : "Marked done.", {
            size: 10,
            leading: 14,
            color: MUTED,
          });
        }

        if (step.followupAnswer) {
          flow.space(3);
          const asked = step.followupPrompt ? `${step.followupPrompt} ` : "";
          const said = step.followupAnswer === "yes" ? "Yes" : step.followupAnswer === "no" ? "No" : step.followupAnswer;
          flow.text(`${asked}${said}`, { size: 10, leading: 14, color: MUTED });
        }
      }
    }
  }

  }

  /* -------------------------------------------------------------- footer */

  const pages = flow.pages;
  pages.forEach((page, i) => {
    const label = `Your journal · ${i + 1} of ${pages.length}`;
    const width = fonts.regular.widthOfTextAtSize(label, 8.5);
    page.drawText(label, {
      x: (PAGE_W - width) / 2,
      y: 44,
      size: 8.5,
      font: fonts.regular,
      color: MUTED,
    });
  });

  return doc.save();
}
