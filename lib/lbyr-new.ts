import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/course-media";
import { DOWNLOADS_BUCKET } from "@/lib/fj-storage";
import { getLearner, type Learner } from "@/lib/following-jesus-access";
import { getMemberByEmail, isActive } from "@/lib/members";
import { beforeBodyEnd, beforeHeadEnd, escapeHtml, swap, transcriptHeadings } from "@/lib/fj-html";
import { LBYR_NEW_LIVE } from "@/lib/lbyr-new-live";

/*
 * Lead Before You're Ready: the new edition (October 2026), a hidden test
 * course until Richmond says "publish" (lib/lbyr-new-live.ts). The September
 * edition (lib/lbyr-course.ts) is separate and untouched.
 *
 *  1. Its own course_slug, "lead-before-youre-ready-new". It only ever reads and
 *     writes course_progress rows with that slug, through the member's own
 *     session (RLS keeps them to their own rows). The September edition's
 *     progress stays in the database, untouched.
 *  2. Its own folders: content/courses/lead-before-youre-ready-new/ for the
 *     pages; course-media/audio/lead-before-youre-ready-new/ for the recordings
 *     (not audio/lead-before-youre-ready/, where the September recordings sit
 *     under the same file names); course-downloads/lead-before-youre-ready-new/
 *     for the Leader's Guide.
 *  3. The Welcome page and Concerns, Care and Reporting are open to anyone;
 *     everything else is for active members. All of it says noindex until
 *     publish.
 *
 * The HTML is Richmond's finished pages, served as the files themselves.
 * Changes on the way out are exact swaps that must match a set number of times
 * (swap() in fj-html.ts), listed in the folder's README.
 *
 * Nothing a learner types is saved or sent: the pages have no code for it, and
 * nothing here adds any. Only "I have completed this lesson" is saved, as
 * progress, and its request carries nothing but the lesson's address.
 */

export const LBYR_NEW_KEY = "lead-before-youre-ready-new";
export const LBYR_NEW_PATH = `/members/courses/${LBYR_NEW_KEY}`;
export const LBYR_WELCOME_PATH = `${LBYR_NEW_PATH}/welcome`;
export const LBYR_HOW_PATH = `${LBYR_NEW_PATH}/how-this-course-works`;
export const LBYR_PLAN_PATH = `${LBYR_NEW_PATH}/my-leadership-plan`;
export const LBYR_CONCERNS_PATH = `${LBYR_NEW_PATH}/concerns-care-and-reporting`;
/** The book's store page: "The full chapter" in each lesson points here, as members do not own the book. */
const BOOK_PATH = "/guides/lead-before-youre-ready";
const CONTENT_ROOT = join(process.cwd(), "content", "courses", LBYR_NEW_KEY);
const COURSE = "Lead Before You’re Ready";

/* ------------------------------------------------------------- the switch */

/** Whether the course may be opened here: always once live; before that, only off the live site. */
export function lbyrNewOpen(): boolean {
  if (LBYR_NEW_LIVE) return true;
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV !== "production";
  return process.env.NODE_ENV !== "production";
}

/** Every route of the course calls this first: "not found" on the live site until publish. */
export function requireLbyrNewOpen(): void {
  if (!lbyrNewOpen()) notFound();
}

/* ---------------------------------------------------------------- lessons */

export type LbyrNewUnit = {
  slug: string;
  n: number;
  label: string;
  title: string;
  part: number;
  /** As each page's own chip gives it. */
  minutes: number;
  /** The recording's name, as player.html asks for it. */
  narration: string;
};

/** Each lesson's title and length, as its page gives them. */
const LESSONS: [string, number][] = [
  ["Called, Not Qualified", 20],
  ["Leading Yourself First", 17],
  ["Knowing Your Role", 22],
  ["Building a Volunteer Team", 19],
  ["Helping Volunteers Stay and Grow", 21],
  ["Running a Meeting People Want to Attend", 20],
  ["The Conversation You’re Avoiding", 20],
  ["Criticism, Control and Ongoing Pastoral Needs", 22],
  ["Burnout and Boundaries", 19],
  ["Growing the Next Leader", 21],
];

/** The three parts, as the Welcome page names them. */
export const PARTS: { n: number; title: string; first: number }[] = [
  { n: 1, title: "Part 1 · Start With Yourself", first: 1 },
  { n: 2, title: "Part 2 · Learn the Craft", first: 4 },
  { n: 3, title: "Part 3 · Face What Tests You", first: 8 },
];

const partOf = (n: number) => [...PARTS].reverse().find((p) => n >= p.first)!.n;
const two = (n: number) => String(n).padStart(2, "0");

export const LBYR_NEW_UNITS: LbyrNewUnit[] = LESSONS.map(([title, minutes], i) => ({
  slug: `lesson-${two(i + 1)}`,
  n: i + 1,
  label: `Lesson ${i + 1}`,
  title,
  part: partOf(i + 1),
  minutes,
  narration: `lbyr-lesson-${two(i + 1)}.mp3`,
}));

export function findUnit(slug: string): LbyrNewUnit | null {
  return LBYR_NEW_UNITS.find((u) => u.slug === slug) ?? null;
}

export const unitPath = (u: LbyrNewUnit) => `${LBYR_NEW_PATH}/${u.slug}`;

/** Whether a lesson's pages have been added yet. They arrive a step at a time while the course is hidden. */
export const unitAdded = (u: LbyrNewUnit) => existsSync(join(CONTENT_ROOT, u.slug, "page.html"));
const planAdded = () => existsSync(join(CONTENT_ROOT, "my-leadership-plan.html"));

/* ----------------------------------------------------------------- access */

/** The signed-in person and whether their membership is active. */
export async function getViewer(): Promise<{ learner: Learner | null; active: boolean }> {
  const learner = await getLearner();
  if (!learner) return { learner: null, active: false };
  return { learner, active: isActive(await getMemberByEmail(learner.email)) };
}

/** The signed-in member with an active membership; otherwise null. */
export async function activeMemberLearner(): Promise<Learner | null> {
  const { learner, active } = await getViewer();
  return active ? learner : null;
}

/* --------------------------------------------------------------- progress */

/** Lessons of this edition the member has completed, each with when. Read through their own session. */
export async function getCompleted(): Promise<Map<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_progress")
    .select("lesson_slug, completed_at")
    .eq("course_slug", LBYR_NEW_KEY)
    .not("completed_at", "is", null);
  if (error) throw new Error(`Could not load progress: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.lesson_slug as string, r.completed_at as string]));
}

/** Mark a lesson complete for this edition only. Marking it again keeps the first date. */
export async function completeUnit(learner: Learner, unit: LbyrNewUnit): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from("course_progress")
    .select("completed_at")
    .eq("course_slug", LBYR_NEW_KEY)
    .eq("lesson_slug", unit.slug)
    .maybeSingle();
  if (readError) throw new Error(`Could not read progress: ${readError.message}`);
  if (existing?.completed_at) return;

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: learner.userId,
      course_slug: LBYR_NEW_KEY,
      lesson_slug: unit.slug,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(`Could not save progress: ${error.message}`);
}

/* ------------------------------------------------------------------ media */

const AUDIO_SECONDS = 60 * 60;

/** A signed URL for a lesson's recording, or null if it is not its recording or not uploaded. */
export async function signedUnitAudio(unit: LbyrNewUnit, file: string): Promise<string | null> {
  if (file !== unit.narration) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(`audio/${LBYR_NEW_KEY}/${file}`, AUDIO_SECONDS);
  if (error) {
    if (!/not found|does not exist/i.test(error.message)) console.error(`Could not sign ${file}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** The Leader's Guide, the only download. Members only, served by downloads/[file]. */
export const LEADERS_GUIDE = "leaders-guide.pdf";
export const leadersGuideHref = `${LBYR_NEW_PATH}/downloads/${LEADERS_GUIDE}`;

/** A minute is plenty: the URL is used by the redirect straight away. */
const DOWNLOAD_SECONDS = 60;

/** A signed URL for the Leader's Guide in the private downloads bucket, or null. */
export async function signedDownload(file: string): Promise<string | null> {
  if (file !== LEADERS_GUIDE) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(DOWNLOADS_BUCKET)
    .createSignedUrl(`${LBYR_NEW_KEY}/${file}`, DOWNLOAD_SECONDS, {
      download: "lead-before-youre-ready-leaders-guide.pdf",
    });
  if (error) {
    console.error(`Could not sign ${file} for ${LBYR_NEW_KEY}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/* ------------------------------------------------------------ page files */

type PageFile = "welcome.html" | "how-this-course-works.html" | "my-leadership-plan.html";

export async function readPage(name: PageFile): Promise<string> {
  return readFile(join(CONTENT_ROOT, name), "utf8");
}

export async function readUnitFile(unit: LbyrNewUnit, name: "page.html" | "player.html"): Promise<string> {
  return readFile(join(CONTENT_ROOT, unit.slug, name), "utf8");
}

/* ------------------------------------------------------- shared swaps */

// Everything the site adds carries a data-lbyr attribute, so
// scripts/verify-lbyr-new.mjs can tell it from the finished files.

// The pages ask Google for their fonts; the site serves the same families
// itself (fonts/lbyr-*.woff2, made by scripts/fetch-fonts.mjs with every
// letter these pages use), so a visitor's browser asks Google for nothing.
const PAGE_FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@400;600;700&display=swap">';
const PLAYER_PRECONNECT =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
const PLAYER_FONTS = (hebrew: boolean) =>
  `<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&${hebrew ? "family=Noto+Serif+Hebrew:wght@400;600&" : ""}family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">`;
const FONT_PATH = "/courses/following-jesus/fonts";
const SELF_HOSTED_FONTS = `<style data-lbyr>
@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:400 600;font-display:swap;src:url(${FONT_PATH}/lbyr-source-serif-4-normal.woff2) format('woff2')}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:400;font-display:swap;src:url(${FONT_PATH}/lbyr-source-serif-4-italic.woff2) format('woff2')}
@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:400 700;font-display:swap;src:url(${FONT_PATH}/lbyr-source-sans-3-normal.woff2) format('woff2')}
</style>`;
const HEBREW_FONT = `<style data-lbyr>@font-face{font-family:'Noto Serif Hebrew';font-style:normal;font-weight:400 600;font-display:swap;src:url(${FONT_PATH}/lbyr-noto-serif-hebrew.woff2) format('woff2')}</style>`;

const NOINDEX = '<meta data-lbyr name="robots" content="noindex, nofollow">';

// A page the browser restores from its back/forward cache is reloaded, so an
// old copy, with whatever was typed into it, is never shown again.
const NEVER_STALE =
  "<script data-lbyr>addEventListener('pageshow',function(e){if(e.persisted)location.reload();});</script>";

// Some browsers put back what was typed into a page when it is opened again
// from history. The pages promise that answers are gone once the learner
// leaves, so every writing box and tick starts empty each time the page is
// shown. Nothing is read or sent: each field is only set back to its default.
const FORGET_ANSWERS =
  "<script data-lbyr>addEventListener('pageshow',function(){document.querySelectorAll('textarea,input').forEach(function(f){if(f.type==='checkbox'||f.type==='radio')f.checked=f.defaultChecked;else f.value=f.defaultValue;});});</script>";

const NEW_TAB = 'target="_blank" rel="noopener"';

// A quiet bar back to the course page, its link a full 44px tap target. Not
// printed: "Print" gives the learner's own page and nothing of the site's.
// "home" is the course page itself, which has no link back to itself.
type Bar = "member" | "visitor" | "home";
const BAR_LINK = "color:#e3c98a;display:inline-flex;align-items:center;min-height:44px;padding:0 6px";
function courseBar(bar: Bar): string {
  const link = {
    member: `<span aria-hidden="true">·</span><a href="${LBYR_NEW_PATH}" style="${BAR_LINK}">Course page</a>`,
    visitor: `<span aria-hidden="true">·</span><a href="/courses" style="${BAR_LINK}">Faithful Path courses</a>`,
    home: "",
  }[bar];
  // While hidden, a note on a line of its own under the bar's links.
  const test = LBYR_NEW_LIVE ? "" : `<div style="color:#f3c27a;padding:0 0 8px">Test edition, not yet published</div>`;
  const main = `<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;column-gap:6px;min-height:44px">${COURSE}${link}</div>`;
  return `<style data-lbyr>@media print{.lbyr-bar{display:none!important}}</style><div data-lbyr class="lbyr-bar" style="background:#1d2738;color:#f3ecd8;text-align:center;font:600 14px/1.4 'Source Sans 3',system-ui,sans-serif;padding:0 12px">${main}${test}</div>`;
}

/** The swaps every page of the course gets. */
function websitePage(
  html: string,
  { bar, concernsNewTab, indexable = false }: { bar: Bar; concernsNewTab: boolean; indexable?: boolean }
): string {
  let out = swap(html, PAGE_FONTS, SELF_HOSTED_FONTS);
  if (!indexable) out = beforeHeadEnd(out, NOINDEX);
  out = beforeHeadEnd(out, NEVER_STALE);
  out = swap(out, "<body>", `<body>\n${courseBar(bar)}`);

  // "Concerns, Care and Reporting", in the header and the footer of every
  // page: the course's page of that name. From a page with writing boxes it
  // opens in a new tab, so nothing typed is lost.
  const concerns = out.split('href="#concerns"').length - 1;
  if (concerns < 2) throw new Error(`Expected at least 2 Concerns links, found ${concerns}.`);
  out = swap(out, 'href="#concerns"', `href="${LBYR_CONCERNS_PATH}"${concernsNewTab ? ` ${NEW_TAB}` : ""}`, concerns);
  // Links only: the illustrations' <use href="#stairs"> are not placeholders.
  if (/<a [^>]*href="#/.test(out)) throw new Error("A placeholder link is left.");

  return beforeBodyEnd(out, FORGET_ANSWERS);
}

const LESSON_1_FILE =
  'href="../02%20Lessons/Lesson%2001%20-%20Called%20Not%20Qualified/3%20Finished%20Lesson/Open-This-Lesson-Page.html"';

/* --------------------------------------------------------- Start Here */

/** The Welcome page. Open to anyone; a visitor without an active membership sees how to join or sign in under it. */
export function welcomeHtml(raw: string, viewer: { signedIn: boolean; active: boolean }): string {
  let html = websitePage(raw, { bar: viewer.active ? "member" : "visitor", concernsNewTab: false });
  html = swap(html, 'href="How-This-Course-Works.html"', `href="${LBYR_HOW_PATH}"`);
  html = swap(html, LESSON_1_FILE, `href="${unitPath(LBYR_NEW_UNITS[0])}"`);
  if (!viewer.active) {
    const second = viewer.signedIn
      ? `<a class="btn alt" href="/members">Your account</a>`
      : `<a class="btn alt" href="/members/login">Sign in</a>`;
    const note = viewer.signedIn
      ? "You are signed in, but this email has no active membership."
      : "Already a member? Sign in to open the lessons.";
    html = swap(
      html,
      "</main>",
      `<section data-lbyr class="card" style="text-align:center"><h2>Part of the Faithful Path membership</h2>
 <p>${COURSE} is included in the Faithful Path membership, with all its courses, for US$19 a month.</p>
 <p class="small">${note}</p>
 <div class="navbtns"><a class="btn" href="/membership">Join the membership</a>${second}</div></section>
</main>`
    );
  }
  return html;
}

/** How This Course Works. Members only. */
export function howHtml(raw: string): string {
  let html = websitePage(raw, { bar: "member", concernsNewTab: false });
  html = swap(html, LESSON_1_FILE, `href="${unitPath(LBYR_NEW_UNITS[0])}"`);
  html = swap(html, 'href="Welcome.html"', `href="${LBYR_WELCOME_PATH}"`);
  return html;
}

/* ----------------------------------------------------------- lessons */

/** The teaching player, framed by the lesson page. Fonts from this site, and the recording from storage. */
export function playerHtml(unit: LbyrNewUnit, raw: string): string {
  let html = swap(raw, PLAYER_PRECONNECT, "");
  if (html.includes(PLAYER_FONTS(true))) html = swap(html, PLAYER_FONTS(true), `${SELF_HOSTED_FONTS}${HEBREW_FONT}`);
  else html = swap(html, PLAYER_FONTS(false), SELF_HOSTED_FONTS);
  html = swap(html, `src="${unit.narration}"`, `src="${unitPath(unit)}/audio/${unit.narration}"`);
  return beforeHeadEnd(html, NOINDEX);
}

const FINISH_STOP =
  `<button class="btn alt" onclick="this.parentNode.querySelector('.done').style.display='inline'">Stop here for today</button>`;
const FINISH_DONE =
  `<button class="btn" onclick="this.parentNode.querySelector('.done').style.display='inline'">I have completed this lesson</button>`;

/** The lesson page as the website serves it. */
export function unitHtml(unit: LbyrNewUnit, raw: string, completed: Map<string, string>): string {
  let html = websitePage(raw, { bar: "member", concernsNewTab: true });
  html = transcriptHeadings(html);

  // The player, from this site.
  html = swap(html, '<iframe src="player.html"', `<iframe src="${unitPath(unit)}/player"`);

  // "The full chapter": the book's store page, in a new tab. The words stay as written.
  const chapter = `<p>Chapter ${unit.n} of <i>${COURSE}</i>`;
  html = swap(html, chapter, `<p><a data-lbyr href="${BOOK_PATH}" ${NEW_TAB}>Chapter ${unit.n} of <i>${COURSE}</i></a>`);

  // Finish: "Stop here for today" goes back to the course page. "I have
  // completed this lesson" saves progress, then shows the page's own
  // thank-you line and the way on to the next lesson (after Lesson 10, to My
  // Leadership Plan).
  const done = completed.has(unit.slug);
  const next = LBYR_NEW_UNITS[LBYR_NEW_UNITS.indexOf(unit) + 1];
  const [nextHref, nextText] = next
    ? [unitPath(next), `Continue to ${next.label} ›`]
    : [LBYR_PLAN_PATH, "Go on to My Leadership Plan ›"];
  html = swap(html, FINISH_STOP, `<a class="btn alt" href="${LBYR_NEW_PATH}" style="text-decoration:none">Stop here for today</a>`);
  html = swap(html, FINISH_DONE, `<button class="btn" id="lbyr-done">${done ? "✓ Completed" : "I have completed this lesson"}</button>`);
  const doneSpans = html.match(/<span class="done">[^<]*<\/span><\/div>/g) ?? [];
  if (doneSpans.length !== 1) throw new Error(`${unit.slug}: expected one finish line, found ${doneSpans.length}.`);
  const doneSpan = doneSpans[0].replace(/<\/div>$/, "");
  html = swap(
    html,
    doneSpan,
    (done ? doneSpan.replace('<span class="done">', '<span class="done" style="display:inline">') : doneSpan) +
      `<a data-lbyr class="btn" id="lbyr-next" href="${nextHref}" style="text-decoration:none;display:${done ? "inline-block" : "none"}">${escapeHtml(nextText)}</a>`
  );

  return beforeBodyEnd(
    html,
    `<p data-lbyr id="lbyr-done-error" role="alert" hidden style="position:fixed;left:12px;right:12px;bottom:12px;background:#7a2e1f;color:#fff;padding:10px 14px;border-radius:10px;font:600 15px/1.4 system-ui,sans-serif;z-index:99">That did not save. Please check your connection and try again.</p>
<script data-lbyr>
(function(){
  var btn=document.getElementById('lbyr-done'),err=document.getElementById('lbyr-done-error'),fin=btn.parentNode;
  btn.onclick=function(){
    btn.disabled=true;err.hidden=true;
    fetch(${JSON.stringify(`${unitPath(unit)}/complete`)},{method:'POST',credentials:'same-origin'})
      .then(function(r){if(!r.ok)throw new Error(r.status);
        fin.querySelector('.done').style.display='inline';document.getElementById('lbyr-next').style.display='inline-block';btn.textContent='✓ Completed';})
      .catch(function(){err.hidden=false;})
      .then(function(){btn.disabled=false;});
  };
})();
</script>`
  );
}

/* ------------------------------------------------- My Leadership Plan */

const PLAN_SCRIPT_START = "<script>\n/* Completion record.";
const LESSON_FILE_LINK = /\.\.\/02%20Lessons\/Lesson%20(\d\d)%20-%20[^"]*?\/3%20Finished%20Lesson\/Open-This-Lesson-Page\.html/g;

/**
 * The closing page. Its own script shows the completion record from
 * window.LBYR_PROGRESS = { completed: { "1": "2026-10-20", … } }, which the
 * site supplies just before it: each completed lesson's first completion,
 * as a date in the member's own time zone (worked out in their browser from
 * the saved time). The completion date it shows is the latest of these, and
 * since a lesson keeps its first date, it stays the same on every visit.
 */
export function planHtml(raw: string, completed: Map<string, string>): string {
  // Lesson links (the ten steps, the page's own lesson list, and the Lesson
  // 10 sheet), "Talk to a Pastor" and "Other Faithful Path courses". Both of
  // the last open in a new tab, so nothing typed on the plan is lost.
  const lessonLinks = raw.match(LESSON_FILE_LINK) ?? [];
  if (lessonLinks.length !== 21) throw new Error(`My Leadership Plan: expected 21 lesson links, found ${lessonLinks.length}.`);
  let html = raw.replace(LESSON_FILE_LINK, (_m, nn: string) => unitPath(LBYR_NEW_UNITS[Number(nn) - 1]));
  html = swap(html, 'href="#talk-to-a-pastor"', `href="/talk-to-a-pastor" ${NEW_TAB}`);
  html = swap(html, 'href="#courses"', `href="/courses" ${NEW_TAB}`);
  html = websitePage(html, { bar: "member", concernsNewTab: true });

  const times: Record<string, string> = {};
  for (const u of LBYR_NEW_UNITS) {
    const at = completed.get(u.slug);
    if (at) times[String(u.n)] = at;
  }
  const progress = `<script data-lbyr>
(function(){
  var t=${JSON.stringify(times)},c={};
  for(var n in t){var d=new Date(t[n]);c[n]=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
  window.LBYR_PROGRESS={completed:c};
})();
</script>
`;
  return swap(html, PLAN_SCRIPT_START, progress + PLAN_SCRIPT_START);
}

/* --------------------------------------------------------- course page */

/** The course page: Start Here, the ten lessons in their parts, My Leadership Plan and the Leader's Guide. */
export function homeHtml(completed: Map<string, string>): string {
  const row = (href: string | null, lab: string, title: string, status: string, done = false) => {
    const inner = `<span class="lab">${escapeHtml(lab)}</span><span class="t">${escapeHtml(title)}</span><span class="st${done ? " done" : ""}">${escapeHtml(status)}</span>`;
    return href ? `<li><a href="${href}">${inner}</a></li>` : `<li><span class="row off">${inner}</span></li>`;
  };
  // While the course is hidden, its pages are added a few at a time; a lesson
  // not added yet is listed, but not linked.
  const notYet = "Not added yet (test edition)";
  const startHere = [
    row(LBYR_WELCOME_PATH, "Start Here · 1 of 2", "Welcome", "A practical course for new church leaders"),
    row(LBYR_HOW_PATH, "Start Here · 2 of 2", "How This Course Works", "One lesson a week, at your own pace"),
  ].join("");
  const parts = PARTS.map((p) => {
    const rows = LBYR_NEW_UNITS.filter((u) => u.part === p.n)
      .map((u) => {
        const done = completed.has(u.slug);
        if (!unitAdded(u)) return row(null, u.label, u.title, notYet);
        return row(unitPath(u), u.label, u.title, done ? "✓ Completed" : `About ${u.minutes} minutes`, done);
      })
      .join("");
    return `<h2>${escapeHtml(p.title)}</h2><ul>${rows}</ul>`;
  }).join("");
  const plan = planAdded()
    ? row(LBYR_PLAN_PATH, "Closing page", "My Leadership Plan", "Bringing the ten lessons together")
    : row(null, "Closing page", "My Leadership Plan", notYet);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${COURSE}</title>${NOINDEX}${SELF_HOSTED_FONTS}${NEVER_STALE}
<style data-lbyr>
body{margin:0;background:#fbf6ea;color:#2b3445;font:17px/1.55 'Source Sans 3',system-ui,sans-serif}
header{background:linear-gradient(180deg,#f7efdf,#f3e3c4);padding:30px 16px 30px}
.w{max-width:760px;margin:0 auto}
h1{font:600 clamp(28px,5vw,40px)/1.15 'Source Serif 4',serif;margin:6px 0 8px}
h2{font:600 15px/1.3 'Source Sans 3',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6a24;margin:28px 0 10px}
.k{letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#8a6a24;margin:0}
p.s{margin:0;color:#5a6577;font:italic 19px/1.4 'Source Serif 4',serif}
main{padding:22px 16px 40px}
.note{background:#fffaf0;border:1px solid #e3d6b8;border-radius:12px;padding:12px 14px;font-size:15px;margin:0 0 12px}
.note a,.lg a{color:#8a6a24;font-weight:700}
.lg{background:#fdf3dc;border:2px solid #c9963f;border-radius:14px;padding:14px 16px;font-size:16px;margin:28px 0 0}
.lg a{display:inline-flex;align-items:center;min-height:44px}
ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
li a,.row{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;background:#fffaf0;border:1px solid #e3d6b8;border-radius:14px;padding:16px;color:inherit;text-decoration:none}
.row.off{opacity:.6}
li a:hover,li a:focus-visible{border-color:#8a6a24;outline:none;box-shadow:0 0 0 3px rgba(138,106,36,.25)}
.lab{grid-row:span 2;font:600 13px/1.2 'Source Sans 3',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a6a24;padding-top:4px;max-width:7.5em}
.t{font:600 19px/1.3 'Source Serif 4',serif}
.st{font-size:14px;color:#5a6577}.st.done{color:#2f6b3a;font-weight:600}
@media(max-width:480px){li a,.row{grid-template-columns:1fr}.lab{grid-row:auto;max-width:none}}
footer{text-align:center;font-size:13px;color:#5a6577;padding:0 16px 30px}
footer a{color:#8a6a24;display:inline-flex;align-items:center;min-height:44px;padding:0 4px}
</style></head><body>
${courseBar("home")}
<header><div class="w"><p class="k">Faithful Path · Membership course</p><h1>${COURSE}</h1><p class="s">A practical course for new church leaders</p></div></header>
<main class="w">
<p class="note">Ten narrated lessons with slides, each about 20 minutes. All the lessons are open, so you may take them in any order. Only the lessons you mark complete are saved; nothing you write on the lesson pages is saved.</p>
<p class="note">If you have a concern about harm, abuse or misconduct, go to <a href="${LBYR_CONCERNS_PATH}">Concerns, Care and Reporting</a>.</p>
<h2>Start Here</h2><ul>${startHere}</ul>
${parts}
<h2>Closing</h2><ul>${plan}</ul>
<div class="lg"><b>Training new leaders, or leading a group?</b> The Leader’s Guide is for pastors and ministry mentors.<br><a href="${leadersGuideHref}">Download the Leader’s Guide (PDF)</a></div>
</main>
<footer><a href="/members">Back to your membership</a> · <a href="/contact">Questions? Contact us</a></footer>
</body></html>`;
}

export function lbyrHtmlResponse(html: string): Response {
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
