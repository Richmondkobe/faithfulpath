import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SERIES_PATH, type FjCourse } from "@/lib/following-jesus";

// The Following Jesus pages are Richmond's reviewed, final HTML, served as
// whole documents rather than rebuilt in React: their wording, slides, colours
// and layout are approved as they are, and the surest way to keep them so is
// to send the file itself. See content/courses/following-jesus/README.md.
//
// What changes on the way out is listed there and made here, each as an exact
// string swap that must match a set number of times. A page that has drifted
// from what this expects is refused with an error, not served half-changed.

const CONTENT_ROOT = join(process.cwd(), "content", "courses", "following-jesus");

/** One of a course's pages, read from the content folder. */
export async function readCoursePage(course: FjCourse, file: string): Promise<string> {
  if (!/^(?:[a-z0-9-]+\/)?[a-z0-9-]+\.html$/.test(file)) {
    throw new Error(`Not a course page: ${file}`);
  }
  return readFile(join(CONTENT_ROOT, course.slug, file), "utf8");
}

/**
 * Replace `from` with `to`, which must occur exactly `times` times.
 * The point of the count is the error: a reworded button or a second footer is
 * something to look at, not something to swap blindly.
 */
export function swap(html: string, from: string, to: string, times = 1): string {
  const found = html.split(from).length - 1;
  if (found !== times) {
    throw new Error(
      `Expected ${times} of ${JSON.stringify(from.slice(0, 80))} in a Following Jesus page, found ${found}.`
    );
  }
  return html.split(from).join(to);
}

/** Put markup in just before the closing tag of the body. */
export function beforeBodyEnd(html: string, markup: string): string {
  return swap(html, "</body>", `${markup}\n</body>`);
}

/** Put markup at the end of the head. */
export function beforeHeadEnd(html: string, markup: string): string {
  return swap(html, "</head>", `${markup}</head>`);
}

/* ------------------------------------------------- swaps every page needs */

// Everything the site adds to a page carries a data-fj attribute, so that
// scripts/verify-fj-pages.mjs can set it aside and prove the rest of the page
// is the reviewed file. Keep it on anything added here or in fj-*.ts.

const GOOGLE_FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Source+Sans+3:wght@400;600;700&display=swap">';

const FONT_PATH = `${SERIES_PATH}/fonts`;

// The same two families, the same weights, from this site. Nothing about the
// page asks Google for anything, so a visitor's address goes nowhere else.
const SELF_HOSTED_FONTS = `<style data-fj>
@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:400 600;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-normal.woff2) format('woff2')}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:400;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-italic.woff2) format('woff2')}
@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:400 700;font-display:swap;src:url(${FONT_PATH}/fj-source-sans-3-normal.woff2) format('woff2')}
</style>`;

const DEAD_HELP_LINK = '<a href="#" onclick="return false">Need help?</a>';

// The pages' small gold text (headings like "IN THIS LESSON", lesson labels,
// "from Lessons 1 · 2 · 3 · 4", links) is all the one colour, --gold-d,
// #a8792b: 3.4 to 3.9 to 1 on the cream, under the 4.5 to 1 WCAG AA asks of
// text this size. Richmond asked for the slightly deeper gold the website's
// own sections use (7 October 2026): #8f6420, 4.65 to 1 or better on every
// background the pages use. Only this one colour changes.
// scripts/verify-fj-pages.mjs allows this definition and no other.
export const DEEPER_GOLD = "<style data-fj>:root{--gold-d:#8f6420}</style>";

// Every one of these pages depends on who is signed in and what they have
// bought, completed or written, so a copy kept by the browser is wrong the
// moment anything changes. Found in Richmond's first live test (6 October
// 2026): Back from a lesson showed the Begin page as it was before he bought
// it — "this email has not bought Begin". no-store (in htmlResponse) stops the
// browser keeping a copy; this reloads a page the back/forward cache restores
// anyway, which some browsers do even for no-store. On a lesson it also stops
// an old copy of a text box being typed into and saved over a newer answer.
const NEVER_STALE =
  "<script data-fj>addEventListener('pageshow',function(e){if(e.persisted)location.reload();});</script>";

/** The browser tab's title. The files' own were working names ("Begin Lesson 1 Page"). */
function retitle(html: string, title: string): string {
  const titles = html.match(/<title>[^<]*<\/title>/g) ?? [];
  if (titles.length !== 1) throw new Error(`Expected one <title> in a Following Jesus page, found ${titles.length}.`);
  return swap(html, titles[0], `<title>${escapeHtml(title)}</title>`);
}

/**
 * The swaps every lesson, welcome and completion page gets: the tab title,
 * fonts from this site, the preview note gone, "Need help?" to the contact page.
 */
export function websitePage(
  html: string,
  { title, indexable }: { title: string; indexable: boolean }
): string {
  let out = retitle(swap(html, GOOGLE_FONTS, SELF_HOSTED_FONTS), title);

  // The dashed note about the files rather than the course: "Preview: buttons
  // will work on the website." on Begin's pages and Establish's welcome and
  // My Foundations, "Keep this page, player.html and establish-lesson-01.mp3
  // together in this folder…" on Establish's lessons. Whatever it says, it is
  // the preview's note and never belongs on the website.
  const notes = out.match(/ *<div class="preview-note">[^<]*<\/div>\n?/g) ?? [];
  if (notes.length > 1) {
    throw new Error(`Expected at most one preview note in a Following Jesus page, found ${notes.length}.`);
  }
  if (notes[0]) out = swap(out, notes[0], "");

  out = swap(out, DEAD_HELP_LINK, '<a href="/contact">Need help?</a>');
  out = beforeHeadEnd(out, NEVER_STALE);
  out = beforeHeadEnd(out, DEEPER_GOLD);
  if (!indexable) {
    out = beforeHeadEnd(out, '<meta data-fj name="robots" content="noindex, nofollow">');
  }
  return out;
}

/** The player is framed inside the lesson page; it gets the fonts and nothing else. */
export function websitePlayer(html: string, title: string): string {
  const out = retitle(swap(html, GOOGLE_FONTS, SELF_HOSTED_FONTS), title);
  return beforeHeadEnd(out, '<meta data-fj name="robots" content="noindex, nofollow">');
}

/* ------------------------------------------------------------- responses */

export function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Every page varies with who is signed in and what they have bought or
      // done, so no copy is kept anywhere: not shared between visitors, and
      // not reused by the browser on Back. See NEVER_STALE above.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      // Only this site may frame these pages: the lesson page frames its own player.
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}

/** Escape text for HTML, for the few strings that come from outside the files. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
