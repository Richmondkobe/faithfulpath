import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/course-media";
import { getLearner, type Learner } from "@/lib/following-jesus-access";
import { getMemberByEmail, isActive } from "@/lib/members";
import { beforeBodyEnd, beforeHeadEnd, escapeHtml, swap } from "@/lib/fj-html";

/*
 * Stand Firm: A Christian Course on Spiritual Warfare and the Armour of God
 * (November 2026). A membership course: members only, never sold on its own.
 *
 *  1. Its own course_slug, "stand-firm". It only ever reads and writes
 *     course_progress rows with that slug, through the member's own session
 *     (RLS keeps them to their own rows). No new table.
 *  2. Its own folders: content/courses/stand-firm/ for the pages and the
 *     Leader's Guide; course-media/audio/stand-firm/ for the twelve recordings
 *     (private bucket; the MP3s are never in git).
 *  3. Members only, gated as The Christian Spiritual Reset is; every page says
 *     noindex and none is in the sitemap.
 *
 * The HTML is Richmond's approved package, served as the files themselves, as
 * the Following Jesus pages are. Nothing in a page's wording, Scripture or
 * illustrations changes. What the website changes on the way out is a short
 * list of exact swaps (swap() in fj-html.ts), each of which must match a set
 * number of times: fonts from this site, the player and recording from this
 * site, the placeholder links pointed at real pages, a bar back to the course
 * page, Previous / Next links, and the completion button saving progress.
 * Everything added carries data-sf.
 */

export const SF_KEY = "stand-firm";
export const SF_PATH = `/members/courses/${SF_KEY}`;
const CONTENT_ROOT = join(process.cwd(), "content", "courses", SF_KEY);

export type SfLesson = { n: number; slug: string; title: string; part: number };

export const SF_PARTS = [
  { n: 1, title: "Understanding the Battle" },
  { n: 2, title: "The Armour of God" },
  { n: 3, title: "Standing Firm in Everyday Life" },
  { n: 4, title: "Living in Victory" },
];

const TITLES: [number, string][] = [
  [1, "What Is Spiritual Warfare?"],
  [1, "A Real Enemy, Already Defeated"],
  [1, "How the Enemy Works"],
  [2, "Be Strong in the Lord and the Belt of Truth"],
  [2, "The Breastplate of Righteousness and the Shoes of Peace"],
  [2, "The Shield of Faith and the Helmet of Salvation"],
  [2, "The Sword of the Spirit and Praying at All Times"],
  [3, "Is This a Spiritual Attack?"],
  [3, "Submit, Resist and Worship"],
  [3, "Together and Free"],
  [4, "Guarding Your Heart and Passing Faith On"],
  [4, "Until He Comes: Stand Firm"],
];

export const SF_LESSONS: SfLesson[] = TITLES.map(([part, title], i) => ({
  n: i + 1,
  slug: `lesson-${i + 1}`,
  title,
  part,
}));

/** The pages that are not lessons: no player, nothing to complete. */
export const SF_PAGES = {
  "start-here": { file: "start-here/index.html", title: "Start Here" },
  "how-this-course-works": { file: "start-here/how-this-course-works.html", title: "How this course works" },
  "my-plan": { file: "plan/index.html", title: "My Stand Firm Plan" },
} as const;
export type SfPageSlug = keyof typeof SF_PAGES;

export const LEADERS_GUIDE = "Stand-Firm-Leaders-Guide.pdf";
export const leadersGuideHref = `${SF_PATH}/downloads/${LEADERS_GUIDE}`;

export function findLesson(slug: string): SfLesson | null {
  return SF_LESSONS.find((l) => l.slug === slug) ?? null;
}
export function findPage(slug: string): SfPageSlug | null {
  return Object.hasOwn(SF_PAGES, slug) ? (slug as SfPageSlug) : null;
}

export const lessonPath = (l: SfLesson) => `${SF_PATH}/${l.slug}`;
export const pagePath = (p: SfPageSlug) => `${SF_PATH}/${p}`;
const two = (n: number) => String(n).padStart(2, "0");
const narration = (l: SfLesson) => `sf-lesson-${two(l.n)}.mp3`;

/* ----------------------------------------------------------------- access */

/** The signed-in member with an active membership; otherwise null. Signed out and lapsed both come back null. */
export async function activeMemberLearner(): Promise<Learner | null> {
  const learner = await getLearner();
  if (!learner) return null;
  const member = await getMemberByEmail(learner.email);
  return isActive(member) ? learner : null;
}

/* --------------------------------------------------------------- progress */

/** The member's completed lessons and when, read through their own session. */
export async function getCompleted(): Promise<Map<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_progress")
    .select("lesson_slug, completed_at")
    .eq("course_slug", SF_KEY)
    .not("completed_at", "is", null);
  if (error) throw new Error(`Could not load progress: ${error.message}`);
  const lessons = new Set(SF_LESSONS.map((l) => l.slug));
  return new Map(
    (data ?? []).filter((r) => lessons.has(r.lesson_slug)).map((r) => [r.lesson_slug, r.completed_at as string])
  );
}

/**
 * Mark a lesson complete. Marking it again keeps the first date. The
 * course_slug is the constant above, never taken from a request.
 */
export async function completeLesson(learner: Learner, lesson: SfLesson): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from("course_progress")
    .select("completed_at")
    .eq("course_slug", SF_KEY)
    .eq("lesson_slug", lesson.slug)
    .maybeSingle();
  if (readError) throw new Error(`Could not read progress: ${readError.message}`);
  if (existing?.completed_at) return;

  const { error } = await supabase.from("course_progress").upsert(
    { user_id: learner.userId, course_slug: SF_KEY, lesson_slug: lesson.slug, completed_at: new Date().toISOString() },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(`Could not save progress: ${error.message}`);
}

/* ------------------------------------------------------------------ media */

/** As the rest of the site: an hour. Each play asks for a fresh link, so a page left open still works. */
const AUDIO_SECONDS = 60 * 60;

/** A signed URL for a lesson's recording, or null if it is not that lesson's recording or not uploaded. */
export async function signedLessonAudio(lesson: SfLesson, file: string): Promise<string | null> {
  if (file !== narration(lesson)) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(`audio/${SF_KEY}/${file}`, AUDIO_SECONDS);
  if (error) {
    if (!/not found|does not exist/i.test(error.message)) console.error(`Could not sign ${file}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/* ------------------------------------------------------------------ files */

export async function readLessonFile(lesson: SfLesson, name: "index.html" | "player.html"): Promise<string> {
  return readFile(join(CONTENT_ROOT, "lessons", two(lesson.n), name), "utf8");
}
export async function readPageFile(page: SfPageSlug): Promise<string> {
  return readFile(join(CONTENT_ROOT, SF_PAGES[page].file), "utf8");
}
export async function readLeadersGuide(): Promise<Buffer> {
  return readFile(join(CONTENT_ROOT, "downloads", LEADERS_GUIDE));
}

/* ------------------------------------------------------------------ pages */

const GOOGLE_FONTS_PAGE =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@400;600;700&display=swap">';
const GOOGLE_FONTS_PLAYER =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">';
const FONT_PATH = "/courses/following-jesus/fonts";
// The same two families and weights, from this site, so nothing asks Google for anything.
const SELF_HOSTED_FONTS = `<style data-sf>
@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:400 600;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-normal.woff2) format('woff2')}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:400;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-italic.woff2) format('woff2')}
@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:400 700;font-display:swap;src:url(${FONT_PATH}/fj-source-sans-3-normal.woff2) format('woff2')}
</style>`;
const NOINDEX = '<meta data-sf name="robots" content="noindex, nofollow">';
const NEVER_STALE =
  "<script data-sf>addEventListener('pageshow',function(e){if(e.persisted)location.reload();});</script>";

// A quiet bar back to the course page, its link a full 44px tap target.
const COURSE_BAR = `<div data-sf style="background:#22304a;color:#f6ecd6;text-align:center;font:600 14px/1.4 'Source Sans 3',system-ui,sans-serif;padding:0 12px">Stand Firm · <a href="${SF_PATH}" style="color:#e9cf96;display:inline-flex;align-items:center;min-height:44px;padding:0 6px">← Course overview</a></div>`;

/** The swaps every page gets: fonts, noindex, never a stale copy, the bar back to the course page. */
function sitePage(raw: string): string {
  let html = swap(raw, GOOGLE_FONTS_PAGE, SELF_HOSTED_FONTS);
  html = beforeHeadEnd(html, NOINDEX);
  html = beforeHeadEnd(html, NEVER_STALE);
  return swap(html, '<header class="top">', `${COURSE_BAR}\n<header class="top">`);
}

/** Previous / Next under a page, above its footer. */
function pageNav(prev: { href: string; label: string } | null, next: { href: string; label: string } | null): string {
  const a = (x: { href: string; label: string }, align: string) =>
    `<a href="${x.href}" style="display:inline-flex;align-items:center;min-height:44px;padding:0 4px;color:#22304a;font-weight:700;text-decoration:none;text-align:${align}">${escapeHtml(x.label)}</a>`;
  return `<nav data-sf aria-label="Lessons" class="container" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;border-top:1px solid #e3d6b8;margin-top:8px;padding-top:8px;font-family:'Source Sans 3',system-ui,sans-serif">${prev ? a(prev, "left") : "<span></span>"}${next ? a(next, "right") : "<span></span>"}</nav>\n`;
}

/** The slide-and-narration player, framed by the lesson page. Fonts and the recording from this site. */
export function playerHtml(lesson: SfLesson, raw: string): string {
  let html = swap(raw, GOOGLE_FONTS_PLAYER, SELF_HOSTED_FONTS);
  // A members-only address that answers with a fresh signed URL to the private file.
  html = swap(html, `<audio id="aud" src="${narration(lesson)}"`, `<audio id="aud" src="${lessonPath(lesson)}/audio/${narration(lesson)}"`);
  return beforeHeadEnd(html, NOINDEX);
}

/** A lesson page as the website serves it. */
export function lessonHtml(lesson: SfLesson, raw: string, completed: Map<string, string>): string {
  let html = sitePage(raw);
  html = swap(html, '<iframe src="player.html"', `<iframe src="${lessonPath(lesson)}/player"`);

  const prevLesson = SF_LESSONS[lesson.n - 2];
  const nextLesson = SF_LESSONS[lesson.n];
  const prev = prevLesson
    ? { href: lessonPath(prevLesson), label: `‹ Previous: Lesson ${prevLesson.n}` }
    : { href: pagePath("how-this-course-works"), label: "‹ How this course works" };
  const next = nextLesson
    ? { href: lessonPath(nextLesson), label: `Next: Lesson ${nextLesson.n} ›` }
    : { href: pagePath("my-plan"), label: "My Stand Firm Plan ›" };
  html = swap(html, '<footer class="container">', `${pageNav(prev, next)}<footer class="container">`);

  // "I have completed this lesson" saves before it shows its thank-you. If the save fails, it says so.
  const done = `<button class="btn" onclick="this.parentNode.querySelector('.done').style.display='inline'">I have completed this lesson</button>`;
  html = swap(html, done, `<button class="btn" id="sf-done">I have completed this lesson</button>`);
  const already = completed.has(lesson.slug);
  html = beforeBodyEnd(
    html,
    `<p data-sf id="sf-done-error" role="alert" hidden style="position:fixed;left:12px;right:12px;bottom:12px;background:#7a2e1f;color:#fff;padding:10px 14px;border-radius:10px;font:600 15px/1.4 system-ui,sans-serif;z-index:99">That did not save. Please check your connection and try again.</p>
<script data-sf>
(function(){
  var btn=document.getElementById('sf-done'),box=btn.parentNode,msg=box.querySelector('.done'),err=document.getElementById('sf-done-error');
  function mark(){msg.style.display='inline';}
  ${already ? "mark();" : ""}
  btn.onclick=function(){
    btn.disabled=true;err.hidden=true;
    fetch(${JSON.stringify(`${lessonPath(lesson)}/complete`)},{method:'POST',credentials:'same-origin'})
      .then(function(r){if(!r.ok)throw new Error(r.status);mark();})
      .catch(function(){err.hidden=false;})
      .then(function(){btn.disabled=false;});
  };
})();
</script>`
  );
  return html;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Start Here, How this course works, or My Stand Firm Plan, as the website serves it. */
export function pageHtml(page: SfPageSlug, raw: string, completed: Map<string, string>): string {
  let html = sitePage(raw);
  if (page === "start-here") {
    html = swap(html, 'href="how-this-course-works.html"', `href="${pagePath("how-this-course-works")}"`);
    html = swap(html, "<footer", `${pageNav(null, { href: pagePath("how-this-course-works"), label: "How this course works ›" })}<footer`);
  }
  if (page === "how-this-course-works") {
    html = swap(html, 'href="#lesson-1"', `href="${lessonPath(SF_LESSONS[0])}"`);
    html = swap(html, 'href="index.html"', `href="${pagePath("start-here")}"`);
    html = swap(
      html,
      "<footer",
      pageNav({ href: pagePath("start-here"), label: "‹ Start Here" }, { href: lessonPath(SF_LESSONS[0]), label: "Lesson 1 ›" }) + "<footer"
    );
  }
  if (page === "my-plan") {
    // The page reads these to show the member's record (see the script at its end).
    const n = completed.size;
    const last = [...completed.values()].sort().at(-1);
    const doneDate = n === SF_LESSONS.length && last ? longDate(last) : null;
    html = beforeHeadEnd(
      html,
      `<script data-sf>window.SF_COMPLETED=${n};${doneDate ? `window.SF_DONE_DATE=${JSON.stringify(escapeHtml(doneDate))};` : ""}</script>`
    );
    const l12 = SF_LESSONS[SF_LESSONS.length - 1];
    html = swap(html, "<footer", `${pageNav({ href: lessonPath(l12), label: `‹ Lesson ${l12.n}` }, null)}<footer`);
  }
  return html;
}

/** The course overview: Start Here, the twelve lessons in their four parts, the plan and the Leader's Guide. */
export function overviewHtml(completed: Map<string, string>): string {
  const total = SF_LESSONS.length;
  const count = completed.size;
  const nextUp = SF_LESSONS.find((l) => !completed.has(l.slug));
  const item = (href: string, label: string, title: string, status: string, done = false) =>
    `<li><a href="${href}"><span class="lab">${escapeHtml(label)}</span><span class="t">${escapeHtml(title)}</span><span class="st${done ? " done" : ""}">${escapeHtml(status)}</span></a></li>`;
  const parts = SF_PARTS.map((p) => {
    const rows = SF_LESSONS.filter((l) => l.part === p.n)
      .map((l) => {
        const when = completed.get(l.slug);
        return item(lessonPath(l), `Lesson ${l.n}`, l.title, when ? `✓ Completed ${longDate(when)}` : "Not started", Boolean(when));
      })
      .join("");
    return `<h2>Part ${p.n} · ${escapeHtml(p.title)}</h2><ul>${rows}</ul>`;
  }).join("\n");
  const cta = nextUp
    ? `<a class="go" href="${count === 0 ? pagePath("start-here") : lessonPath(nextUp)}">${count === 0 ? "Start Here" : `Continue with Lesson ${nextUp.n}`}</a>`
    : `<a class="go" href="${pagePath("my-plan")}">Open My Stand Firm Plan</a>`;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stand Firm · Faithful Path</title>${NOINDEX}${SELF_HOSTED_FONTS}${NEVER_STALE}
<style data-sf>
body{margin:0;background:#fbf6ea;color:#2b3445;font:17px/1.55 'Source Sans 3',system-ui,sans-serif}
header{background:linear-gradient(180deg,#1d2738,#22304a 60%,#4b5f84);color:#f6ecd6;padding:34px 16px 40px}
.w{max-width:760px;margin:0 auto}
header h1{font:600 clamp(28px,5vw,40px)/1.2 'Source Serif 4',serif;margin:6px 0 8px}
.k{letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#e9cf96;margin:0}
p.s{margin:0;opacity:.9}
main{padding:22px 16px 40px}
.prog{background:#fffaf0;border:2px solid #c9963f;border-radius:14px;padding:14px 16px;margin-bottom:18px}
.prog p{margin:0 0 10px}.prog b{font-size:19px;color:#22304a}
.bar{height:10px;border-radius:5px;background:#eadfc6;overflow:hidden;margin:0 0 14px}.bar i{display:block;height:100%;background:#c9963f}
.go{display:inline-flex;align-items:center;min-height:44px;background:#c9963f;color:#1d2738;font-weight:700;border-radius:10px;padding:0 18px;text-decoration:none}
.go:hover,.go:focus-visible{background:#d9ab5c}
h2{font:600 21px/1.3 'Source Serif 4',serif;color:#22304a;margin:28px 0 10px}
ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
li a{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;background:#fffaf0;border:1px solid #e3d6b8;border-radius:14px;padding:16px;color:inherit;text-decoration:none}
li a:hover,li a:focus-visible{border-color:#8a6a24;outline:none;box-shadow:0 0 0 3px rgba(138,106,36,.25)}
.lab{grid-row:span 2;font:600 13px/1.2 'Source Sans 3',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a6a24;padding-top:4px;min-width:5.5em}
.t{font:600 19px/1.3 'Source Serif 4',serif;color:#22304a}
.st{font-size:14px;color:#5a6577}.st.done{color:#2f6b3a;font-weight:600}
.lg{background:#fffaf0;border:1px solid #e3d6b8;border-radius:12px;padding:12px 16px;margin:28px 0 0}.lg a{color:#8a6a24;font-weight:700;display:inline-flex;align-items:center;min-height:44px}
footer{text-align:center;font-size:13px;color:#5a6577;padding:0 16px 30px}
footer a{color:#8a6a24;display:inline-flex;align-items:center;min-height:44px;padding:0 4px}
</style></head><body>
<header><div class="w"><p class="k">Faithful Path · Membership course</p><h1>Stand Firm</h1><p class="s">A Christian Course on Spiritual Warfare and the Armour of God. Twelve lessons in four parts, with Pastor Richmond Kobe.</p></div></header>
<main class="w">
<section class="prog" aria-label="Your progress"><p><b>${count} of ${total} complete</b></p><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${count}" aria-label="Lessons complete"><i style="width:${Math.round((count / total) * 100)}%"></i></div>${cta}</section>
<h2>Before you begin</h2>
<ul>${item(pagePath("start-here"), "Start", "Start Here", "Welcome to the course")}${item(pagePath("how-this-course-works"), "Start", "How this course works", "What each lesson holds")}</ul>
${parts}
<h2>After the lessons</h2>
<ul>${item(pagePath("my-plan"), "Plan", "My Stand Firm Plan", count === total ? "You have completed all twelve lessons" : "Write it now, or when you finish")}</ul>
<p class="lg"><b>Leading a group?</b> The Leader’s Guide is for small groups and church leaders. <a href="${leadersGuideHref}">⬇ Leader’s Guide (PDF)</a></p>
</main>
<footer><a href="/members">Back to your membership</a> · <a href="/contact">Questions? Contact us</a></footer>
</body></html>`;
}

export function sfHtmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
