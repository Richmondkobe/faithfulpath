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

  // "Preview: buttons will work on the website." — true in the preview, and
  // the one line of the files that is about the files rather than the course.
  const notes = out.match(/ *<div class="preview-note">Preview: [^<]*<\/div>\n?/g) ?? [];
  if (notes.length !== 1) {
    throw new Error(`Expected one preview note in a Following Jesus page, found ${notes.length}.`);
  }
  out = swap(out, notes[0], "");

  out = swap(out, DEAD_HELP_LINK, '<a href="/contact">Need help?</a>');
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

export function htmlResponse(html: string, { cache }: { cache: "private" | "public" }): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Every page varies with who is signed in, so nothing is shared between
      // visitors, and a lesson is never kept by a browser after sign-out.
      "Cache-Control": cache === "private" ? "private, no-store" : "private, no-cache",
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
