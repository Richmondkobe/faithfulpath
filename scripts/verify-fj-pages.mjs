#!/usr/bin/env node
//
// Proves the Following Jesus pages the site serves are Richmond's reviewed
// files, changed only in the ways content/courses/following-jesus/README.md
// lists.
//
//   npm run verify:fj
//
// 1. Every file in the content folder still matches CHECKSUMS.sha256, so the
//    files themselves have not been edited.
// 2. Each page is built through the site's own code, for a visitor and for an
//    owner, and the original and the served page are both opened in a browser
//    with scripts off. Everything a reader meets is compared, element by
//    element: the visible text, the tags and their attributes. What the site
//    added is marked data-fj and set aside (and listed); the preview note is
//    the one thing removed. Beyond that, only these may differ:
//      * the tab title;
//      * href and src (links, the player, the recording);
//      * onclick="return false" on the dead preview links, gone;
//      * a <button> that became a link, keeping its class, style and words;
//      * on a completed lesson, "done" on the finish section;
//      * which of the eight progress dashes are gold (the website lights only
//        lessons the learner has completed);
//      * a line marked data-fj-changed, only if the exact before and after are
//        in ALLOWED_TEXT_CHANGES below;
//      * role="img" on the lessons' labelled progress dashes, for screen readers;
//      * one colour: the site's added styles may redefine --gold-d as #8f6420,
//        the deeper gold, and no other colour or setting of the page;
//      * Support Page names made into links (data-fj-link): each must wrap
//        exactly a Support Page's title and lead to that page, and is then
//        read as plain text, so the words are compared as before. A dead
//        preview link to a Support Page may gain a real href, target and rel.
// 3. No page asks Google, Vercel Analytics or anything else outside the site
//    for anything (the recording's storage URL aside).
//
// Nothing here touches the database or storage: the pages are built from the
// files, with made-up progress and a made-up recording URL.
//
// tsx runs it, for the TypeScript in lib/.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { chromium } from "playwright";

import { COURSES, SUPPORT_PAGES, tabTitle } from "../lib/following-jesus.ts";
import { linkSupportPages, readCoursePage, websitePage } from "../lib/fj-html.ts";
import { completionPage, lessonPage, playerPage } from "../lib/fj-lessons.ts";
import { welcomePage } from "../lib/fj-welcome.ts";
import { answersApiPath, withAnswers } from "../lib/fj-answers-page.ts";

const ROOT = join(process.cwd(), "content", "courses", "following-jesus");
const AUDIO = "https://storage.invalid/audio.mp3?token=test";
const FORBIDDEN = /googleapis|gstatic|googletagmanager|google-analytics|_vercel\/insights|va\.vercel-scripts|vercel-analytics|fbq\(|connect\.facebook|plausible|hotjar|segment\.io/i;

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

/* --------------------------------------------------------- 1. checksums */

for (const course of COURSES.filter((c) => c.launched)) {
  const dir = join(ROOT, course.slug);
  const lines = readFileSync(join(dir, "CHECKSUMS.sha256"), "utf8").trim().split("\n");
  let ok = 0;
  for (const line of lines) {
    const [hash, file] = line.split(/\s+/);
    const actual = createHash("sha256").update(readFileSync(join(dir, file))).digest("hex");
    if (actual === hash) ok++;
    else fail(`${course.slug}/${file} has changed since it was approved`);
  }
  console.log(`${course.title}: ${ok} of ${lines.length} files match the approved originals`);
}

/* ------------------------------------------------------ 2. build pages */

const owner = { userId: "00000000-0000-0000-0000-000000000000", email: "owner@example.com" };

// Lines of the reviewed files the website changes on purpose, word for word.
const ALLOWED_TEXT_CHANGES = [
  // Lesson 8: "You have completed Begin!" moves into its own part, shown only
  // once every lesson is complete (Richmond, 7 October 2026).
  { original: "Well done. Lesson 8 is complete. You have completed Begin!", served: "Well done. Lesson 8 is complete." },
  // Establish's Lesson 10: the file's "Continue to Lesson 11 ›" (there is no
  // Lesson 11) shows as the completion page's name (Richmond, 7 October 2026).
  { original: "Continue to Lesson 11 ›", served: "Continue to My Foundations ›" },
];

const progress = (slugs, done = false) => ({ completed: new Set(slugs), courseCompletedAt: done ? "2026-10-07T00:00:00Z" : null });

async function pagesFor(course) {
  const pages = [];
  const raw = (file) => readCoursePage(course, file);

  const welcome = linkSupportPages(websitePage(await raw("welcome.html"), { title: tabTitle(course.fullTitle), indexable: true }), course);
  pages.push({ name: "welcome (visitor)", original: await raw("welcome.html"), served: welcomePage(welcome, course, null, new Set(), null) });
  pages.push({
    name: "welcome (owner)",
    original: await raw("welcome.html"),
    served: welcomePage(welcome, course, owner, new Set([`following-jesus-${course.slug}`]), {
      completed: new Set([course.lessons[0].slug]),
      courseCompletedAt: null,
    }),
  });

  // Some lessons done, not this one; then the same with this one done too.
  const others = (lesson) => course.lessons.filter((l) => l.number < 3 && l.slug !== lesson.slug).map((l) => l.slug);
  for (const lesson of course.lessons) {
    const file = `${lesson.slug}/lesson.html`;
    const open = withAnswers(await lessonPage(course, lesson, progress(others(lesson))), answersApiPath(course, lesson.slug), {});
    const done = withAnswers(
      await lessonPage(course, lesson, progress([...others(lesson), lesson.slug])),
      answersApiPath(course, lesson.slug),
      {}
    );
    pages.push({ name: `${lesson.slug}`, original: await raw(file), served: open, completedVariant: done, lesson });
    pages.push({ name: `${lesson.slug} player`, original: await raw(`${lesson.slug}/player.html`), served: await playerPage(course, lesson, AUDIO) });
  }

  if (course.completionPage) {
    const slug = course.completionPage.slug;
    pages.push({
      name: slug,
      original: await raw(`${slug}.html`),
      served: withAnswers(await completionPage(course, progress(others(course.lessons[course.lessons.length - 1]))), answersApiPath(course, slug), {}),
    });
  }
  return pages;
}

/* ---------------------------------------------------- 3. compare in a browser */

function snapshot(titles) {
  // Support Page links the site added: note them, then read them as text.
  const supportLinks = [...document.querySelectorAll("a[data-fj-link]")].map((a) => ({
    href: a.getAttribute("href"),
    text: a.textContent,
    target: a.getAttribute("target"),
  }));
  for (const a of document.querySelectorAll("a[data-fj-link]")) a.replaceWith(document.createTextNode(a.textContent));
  document.body.normalize();
  const badLinks = supportLinks.filter((l) => !titles.some((t) => t.title === l.text && l.href.endsWith(`/support/${t.slug}`)));
  const inSkipped = (el) => el.closest("[data-fj]") || el.closest(".preview-note");
  const describe = (el) => {
    const inDashes = !!el.parentElement?.classList.contains("steps8");
    const attrs = {};
    for (const a of el.attributes) attrs[a.name] = a.value;
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    return { tag: el.tagName.toLowerCase(), attrs, text, inDashes };
  };
  return {
    title: document.title,
    head: [...document.head.children]
      .filter((el) => !el.hasAttribute("data-fj") && el.tagName !== "TITLE")
      .filter((el) => !(el.tagName === "LINK" && /fonts\.googleapis\.com/.test(el.getAttribute("href") ?? "")))
      .map(describe),
    body: [...document.body.querySelectorAll("*")].filter((el) => !inSkipped(el)).map(describe),
    previewNotes: document.querySelectorAll(".preview-note").length,
    supportLinks: supportLinks.length,
    badLinks,
    added: [...document.body.querySelectorAll("[data-fj]")]
      .filter((el) => !["SCRIPT", "STYLE"].includes(el.tagName))
      .map((el) => el.id || el.tagName.toLowerCase()),
  };
}

const ALLOWED_ATTR = new Set(["href", "src"]);

function compareElements(name, a, b) {
  if (a.length !== b.length) {
    fail(`${name}: ${a.length} elements in the original, ${b.length} served`);
    return;
  }
  for (let i = 0; i < a.length; i++) {
    const o = a[i];
    const s = b[i];
    const where = `${name}: <${o.tag}> "${o.text.slice(0, 40)}"`;
    const changedOnPurpose = "data-fj-changed" in s.attrs;
    if (changedOnPurpose) {
      if (!ALLOWED_TEXT_CHANGES.some((c) => c.original === o.text && c.served === s.text)) {
        fail(`${where} — marked as changed, but "${s.text}" is not on the list of allowed changes`);
      }
    } else if (o.text !== s.text) fail(`${where} — words changed to "${s.text.slice(0, 60)}"`);
    const buttonToLink = o.tag === "button" && s.tag === "a";
    if (o.tag !== s.tag && !buttonToLink) fail(`${where} — became <${s.tag}>`);
    for (const key of new Set([...Object.keys(o.attrs), ...Object.keys(s.attrs)])) {
      if (o.attrs[key] === s.attrs[key] || ALLOWED_ATTR.has(key)) continue;
      if (key === "data-fj-changed" && changedOnPurpose) continue;
      // A dead link to a Support Page made to work, opening in a new tab.
      if ((key === "target" || key === "rel") && o.attrs[key] === undefined && /\/support\/[a-z-]+$/.test(s.attrs.href ?? "")) continue;
      if (key === "role" && s.attrs.role === "img" && o.attrs.role === undefined && s.attrs.class === "steps8" && o.attrs["aria-label"]) continue;
      if (key === "class" && o.inDashes && s.inDashes && [o.attrs[key], s.attrs[key]].every((v) => v === undefined || v === "on")) continue;
      if (key === "onclick" && o.attrs[key] === "return false" && s.attrs[key] === undefined) continue;
      fail(`${where} — ${key} changed from ${JSON.stringify(o.attrs[key])} to ${JSON.stringify(s.attrs[key])}`);
    }
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false });
const page = await context.newPage();
// Nothing is fetched while comparing.
await page.route("**/*", (route) => route.abort());

async function look(html) {
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  return page.evaluate(snapshot, SUPPORT_PAGES);
}

for (const course of COURSES.filter((c) => c.launched)) {
  console.log(`\n${course.title}: served pages against the originals`);
  for (const p of await pagesFor(course)) {
    const before = failures;
    const o = await look(p.original);
    const s = await look(p.served);
    compareElements(`${p.name} (head)`, o.head, s.head);
    compareElements(p.name, o.body, s.body);

    if (p.completedVariant) {
      // Marking the lesson complete changes exactly two things: "done" on the
      // finish section, and this lesson's dash.
      const n = p.lesson.number;
      const lightDash = (html) =>
        html.replace(/(<span class="steps8"[^>]*>)((?:<i(?: class="on")?><\/i>)+)/, (_, open, dashes) =>
          open + dashes.match(/<i(?: class="on")?><\/i>/g).map((d, i) => (i === n - 1 ? '<i class="on"></i>' : d)).join("")
        );
      const expected = lightDash(p.served).replace(
        '<section class="card finish" id="finish"',
        '<section class="card finish done" id="finish"'
      );
      if (p.completedVariant !== expected) fail(`${p.name}: the completed version differs by more than "done" and its dash`);
      const dashes = (await look(p.completedVariant)).body.filter((e) => e.inDashes).map((e) => (e.attrs.class === "on" ? "●" : "○")).join("");
      const want = course.lessons.map((l) => (l.number < 3 || l.number === n ? "●" : "○")).join("");
      if (dashes !== want) fail(`${p.name}: dashes ${dashes}, expected ${want}`);
    }

    // No preview note reaches the website, whatever it says. (Establish's
    // lessons had one beginning "Keep this page…" that was missed until 8
    // October 2026, because this check only set notes aside.)
    if (s.previewNotes) fail(`${p.name}: a preview note is still on the page`);
    for (const l of s.badLinks) fail(`${p.name}: a Support Page link is wrong: "${l.text}" -> ${l.href}`);

    // The site's own styles may change one of the page's settings, the gold of
    // its small text, and only to the agreed shade.
    for (const [, css] of p.served.matchAll(/<style data-fj[^>]*>([\s\S]*?)<\/style>/g)) {
      for (const [def] of css.matchAll(/--[a-z0-9-]+\s*:[^;}]*/gi)) {
        if (def.replace(/\s/g, "") !== "--gold-d:#8f6420") fail(`${p.name}: the site's styles change a page setting: ${def}`);
      }
    }

    // Outside addresses: only the recording's storage URL, and nothing that
    // reaches Google or an analytics service.
    const urls = [...p.served.matchAll(/https?:\/\/[^\s"'()<>]+/g)].map((m) => m[0]);
    const originalUrls = new Set([...p.original.matchAll(/https?:\/\/[^\s"'()<>]+/g)].map((m) => m[0]));
    for (const url of urls) {
      if (url.startsWith("https://storage.invalid/")) continue;
      if (originalUrls.has(url) && !FORBIDDEN.test(url)) continue;
      if (url === "http://www.w3.org/2000/svg") continue;
      fail(`${p.name}: refers to ${url}`);
    }
    if (FORBIDDEN.test(p.served.replace(/fonts\.googleapis\.com[^"]*"/g, ""))) {
      const hit = p.served.match(FORBIDDEN)?.[0];
      fail(`${p.name}: mentions ${hit}`);
    }

    console.log(
      `  ${failures === before ? "✓" : "✗"} ${p.name.padEnd(20)} "${s.title}"` +
        (s.added.length ? `  + ${s.added.join(", ")}` : "") +
        (s.supportLinks ? `  + ${s.supportLinks} Support Page link${s.supportLinks > 1 ? "s" : ""}` : "")
    );
  }
}
await browser.close();

/* ------------- 4. "You have completed Begin!", and the buttons between books */

for (const course of COURSES.filter((c) => c.launched)) {
  const last = course.lessons[course.lessons.length - 1];

  // "Continue to Book N: …" goes to the next book only once it is listed.
  if (course.completionPage) {
    const next = COURSES.find((c) => c.book === course.book + 1);
    const page = await completionPage(course, progress([]));
    const href = page.match(/<a class="btn gold" href="([^"]+)">Continue to Book/)?.[1];
    const want = next && next.launched && next.listed ? `/courses/following-jesus/${next.slug}` : "/courses/following-jesus";
    if (href !== want) fail(`${course.completionPage.title}: "Continue to Book ${course.book + 1}" goes to ${href}, expected ${want}`);
    else console.log(`\n${course.completionPage.title}: "Continue to Book ${course.book + 1}: ${next?.title}" goes to ${want}`);

    // And it follows the next book's switch: tried both ways, then put back.
    if (next?.launched) {
      const was = next.listed;
      for (const listed of [false, true]) {
        next.listed = listed;
        const h = (await completionPage(course, progress([]))).match(/<a class="btn gold" href="([^"]+)">Continue to Book/)?.[1];
        const w = listed ? `/courses/following-jesus/${next.slug}` : "/courses/following-jesus";
        if (h !== w) fail(`${course.completionPage.title}: with ${next.title} ${listed ? "listed" : "unlisted"}, "Continue to Book ${next.book}" goes to ${h}, expected ${w}`);
      }
      next.listed = was;
      console.log(`  and to ${next.title}'s page once ${next.title} is switched on`);
    }
  }

  // Only a course whose last lesson says the course is complete.
  if (!(await readCoursePage(course, `${last.slug}/lesson.html`)).includes(`You have completed ${course.title}!</p>`)) continue;
  const allButTwo = course.lessons.filter((l) => l.number !== 6 && l.number !== 7).map((l) => l.slug);
  const notYet = await lessonPage(course, last, progress(allButTwo));
  const whole = await lessonPage(course, last, progress(course.lessons.map((l) => l.slug), true));
  const sentence = (html) => html.match(/<span data-fj id="fj-course-done"( hidden)?>/);
  if (!sentence(notYet) || sentence(notYet)[1] !== " hidden") fail(`${last.slug}: "You have completed ${course.title}!" shows before every lesson is complete`);
  else if (!sentence(whole) || sentence(whole)[1]) fail(`${last.slug}: "You have completed ${course.title}!" does not show when the course is complete`);
  else console.log(`\n${last.slug}: "You have completed ${course.title}!" shows only when every lesson is complete`);
}

/* ------------------------------------------ 5. no analytics on /courses */

const analytics = readFileSync(join(process.cwd(), "components", "analytics", "VercelAnalytics.tsx"), "utf8");
if ((analytics.match(/startsWith\("\/courses"\)/g) ?? []).length !== 2) {
  fail("Vercel Analytics is no longer switched off under /courses (components/analytics/VercelAnalytics.tsx)");
} else {
  console.log("\nVercel Analytics is off under /courses");
}

console.log(failures ? `\n${failures} problem(s).\n` : "\nAll Following Jesus pages are the approved files, changed only as listed.\n");
process.exit(failures ? 1 : 0);
