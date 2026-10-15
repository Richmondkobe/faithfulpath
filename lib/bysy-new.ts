import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/course-media";
import { getLearner, type Learner } from "@/lib/following-jesus-access";
import { getMemberByEmail, isActive } from "@/lib/members";
import { beforeBodyEnd, beforeHeadEnd, escapeHtml, swap, transcriptHeadings } from "@/lib/fj-html";
import { HELP_PATH } from "@/lib/site";

/*
 * Before You Say Yes: the current edition, live for members since October 2026. The
 * previous edition is retired; its pages were removed and its old addresses
 * redirect here (next.config.ts).
 *
 *  1. Its own course_slug, "before-you-say-yes-new". It only ever reads and writes
 *     course_progress rows with that slug, through the member's own session
 *     (RLS keeps them to their own rows). The previous edition's progress and
 *     reflections stay in the database, untouched.
 *  2. Its own folders: content/courses/before-you-say-yes-new/ for the pages,
 *     course-media/audio/before-you-say-yes-new/ for the recordings.
 *  3. Members only; the pages say noindex and are not in the sitemap.
 *
 * The HTML is Richmond's reviewed lesson pages, served as the files themselves.
 * Changes on the way out are exact swaps that must match a set number of times
 * (swap() in fj-html.ts), listed in the folder's README.
 *
 * Nothing a learner types in a reflection is saved or sent: the pages have no
 * code for it, and nothing here adds any. Only "I have completed this lesson"
 * is saved, as progress.
 *
 * Removing it: delete this file,
 * app/members/courses/before-you-say-yes-new/,
 * content/courses/before-you-say-yes-new/ and scripts/verify-bysy-new.mjs, and
 * its one line in next.config.ts. Nothing else depends on them.
 */

export const BYSY_NEW_KEY = "before-you-say-yes-new";
export const BYSY_NEW_PATH = `/members/courses/${BYSY_NEW_KEY}`;
const CONTENT_ROOT = join(process.cwd(), "content", "courses", BYSY_NEW_KEY);
const COURSE = "Before You Say Yes";

export type BysyNewUnit = {
  slug: string;
  n: number;
  label: string;
  title: string;
  part: number;
  /** The teaching recording, in course-media/audio/before-you-say-yes-new/. */
  narration: string;
};

const TITLES = [
  "Why Do You Want a Relationship?",
  "What Does “Equally Yoked” Actually Mean?",
  "Know Yourself Before You Choose Someone Else",
  "Attraction Is Not Discernment",
  "Character Before Charisma",
  "Red Flags Christians Spiritualise",
  "The Quiet Green Flags That Matter",
  "Boundaries Without Shame",
  "Sexual Boundaries, Practically",
  "Family Patterns, Loyalties and Boundaries",
  "Money Reveals More Than a Salary",
  "Their Past Matters — But Not the Way You Think",
  "“God Told Me” and Other Hard Questions",
  "Who Should Have a Voice in Your Relationship?",
  "Can We Build a Life Together?",
  "When Good Christians Are Wrong for Each Other",
  "When to Continue With Wisdom",
  "When to Slow Down",
  "When to Walk Away",
  "When You’re Afraid You’ll Never Find Anyone Else",
  "Before You Say Yes to Engagement",
];

/** The five parts of the book, and the closing lesson (part 6 here). */
export const PARTS: { n: number; title: string; first: number }[] = [
  { n: 1, title: "Part 1 · Before You Start Dating", first: 1 },
  { n: 2, title: "Part 2 · Choosing Wisely", first: 4 },
  { n: 3, title: "Part 3 · Dating With Your Eyes Open", first: 8 },
  { n: 4, title: "Part 4 · Discernment", first: 13 },
  { n: 5, title: "Part 5 · Continue, Slow Down or Walk Away", first: 17 },
  { n: 6, title: "The closing lesson", first: 21 },
];

const partOf = (n: number) => [...PARTS].reverse().find((p) => n >= p.first)!.n;
const two = (n: number) => String(n).padStart(2, "0");

export const BYSY_NEW_UNITS: BysyNewUnit[] = TITLES.map((title, i) => ({
  slug: `lesson-${two(i + 1)}`,
  n: i + 1,
  label: `Lesson ${i + 1}`,
  title,
  part: partOf(i + 1),
  narration: `bysy-lesson-${two(i + 1)}.mp3`,
}));

export function findUnit(slug: string): BysyNewUnit | null {
  return BYSY_NEW_UNITS.find((u) => u.slug === slug) ?? null;
}

export const unitPath = (u: BysyNewUnit) => `${BYSY_NEW_PATH}/${u.slug}`;

/* ----------------------------------------------------------------- access */

/** The signed-in member with an active membership; otherwise null. */
export async function activeMemberLearner(): Promise<Learner | null> {
  const learner = await getLearner();
  if (!learner) return null;
  const member = await getMemberByEmail(learner.email);
  return isActive(member) ? learner : null;
}

/* --------------------------------------------------------------- progress */

/** Lessons of this edition the member has completed. Read through their own session. */
export async function getCompleted(): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_progress")
    .select("lesson_slug")
    .eq("course_slug", BYSY_NEW_KEY)
    .not("completed_at", "is", null);
  if (error) throw new Error(`Could not load progress: ${error.message}`);
  return new Set((data ?? []).map((r) => r.lesson_slug));
}

/** Mark a lesson complete for this edition only. Marking it again keeps the first date. */
export async function completeUnit(learner: Learner, unit: BysyNewUnit): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from("course_progress")
    .select("completed_at")
    .eq("course_slug", BYSY_NEW_KEY)
    .eq("lesson_slug", unit.slug)
    .maybeSingle();
  if (readError) throw new Error(`Could not read progress: ${readError.message}`);
  if (existing?.completed_at) return;

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: learner.userId,
      course_slug: BYSY_NEW_KEY,
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
export async function signedUnitAudio(unit: BysyNewUnit, file: string): Promise<string | null> {
  if (file !== unit.narration) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(`audio/${BYSY_NEW_KEY}/${file}`, AUDIO_SECONDS);
  if (error) {
    if (!/not found|does not exist/i.test(error.message)) console.error(`Could not sign ${file}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/* ------------------------------------------------------------------ pages */

/** The Leader's Guide, the only download. Members only, served by downloads/[file]. */
export const LEADERS_GUIDE = "leaders-guide.pdf";
export const leadersGuideHref = `${BYSY_NEW_PATH}/downloads/${LEADERS_GUIDE}`;
export async function readDownload(file: string): Promise<Buffer | null> {
  if (file !== LEADERS_GUIDE) return null;
  return readFile(join(CONTENT_ROOT, "downloads", file));
}

export async function readUnitFile(unit: BysyNewUnit, name: "page.html" | "player.html"): Promise<string> {
  return readFile(join(CONTENT_ROOT, unit.slug, name), "utf8");
}

// The pages ask Google for the fonts; the site serves the same two families itself.
const PAGE_FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@400;600;700&display=swap">';
const PLAYER_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">';
const FONT_PATH = "/courses/following-jesus/fonts";
const SELF_HOSTED_FONTS = `<style data-bysy>
@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:400 600;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-normal.woff2) format('woff2')}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:400;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-italic.woff2) format('woff2')}
@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:400 700;font-display:swap;src:url(${FONT_PATH}/fj-source-sans-3-normal.woff2) format('woff2')}
</style>`;
const NOINDEX = '<meta data-bysy name="robots" content="noindex, nofollow">';
const NEVER_STALE =
  "<script data-bysy>addEventListener('pageshow',function(e){if(e.persisted)location.reload();});</script>";
const PLACEHOLDER = 'href="#"';
// "Leave this page": replaces the page (not added to history) with a neutral one,
// as the live course's exit control does (components/bysy/ExitControl.tsx).
const NEUTRAL_DESTINATION = "https://www.bbc.co.uk/weather";

function retitle(html: string, title: string): string {
  const titles = html.match(/<title>[^<]*<\/title>/g) ?? [];
  if (titles.length !== 1) throw new Error(`Expected one <title>, found ${titles.length}.`);
  return swap(html, titles[0], `<title>${escapeHtml(title)}</title>`);
}

/** The teaching player, framed by the lesson page. Fonts from this site, and the recording from storage. */
export function playerHtml(unit: BysyNewUnit, raw: string): string {
  let html = retitle(swap(raw, PLAYER_FONTS, SELF_HOSTED_FONTS), `${unit.label} · ${COURSE}`);
  // Lessons 1 to 6 give the recording on the audio tag; Lessons 7 to 21 in a <source>.
  const src = `src="${unit.narration}"`;
  if (html.split(src).length - 1 !== 1) throw new Error(`${unit.slug}: expected the recording once in the player.`);
  html = swap(html, src, `src="${unitPath(unit)}/audio/${unit.narration}"`);
  return beforeHeadEnd(html, NOINDEX);
}

/** Talk Before You Marry is live for members, so the closing "(coming soon)" becomes a link. */
const TBYM_LINK = `<a href="/members/courses/talk-before-you-marry-new" style="color:inherit"><i>Talk Before You Marry</i></a>`;
const COMING_SOON = "<i>Talk Before You Marry</i> (coming soon).";

// A quiet bar back to the course page, its link a full 44px tap target.
const COURSE_BAR = `<div data-bysy style="background:#121d33;color:#f3ecd8;text-align:center;font:600 14px/1.4 'Source Sans 3',system-ui,sans-serif;padding:0 12px">${COURSE} · <a href="${BYSY_NEW_PATH}" style="color:#e3c98a;display:inline-flex;align-items:center;min-height:44px;padding:0 6px">Course page</a></div>`;

/** The lesson page as the website serves it. */
export function unitHtml(unit: BysyNewUnit, raw: string, completed: Set<string>): string {
  let html = retitle(swap(raw, PAGE_FONTS, SELF_HOSTED_FONTS), `${unit.label}: ${unit.title} · ${COURSE}`);
  html = transcriptHeadings(html);
  html = beforeHeadEnd(html, NOINDEX);
  html = beforeHeadEnd(html, NEVER_STALE);
  html = swap(html, '<header class="top">', `${COURSE_BAR}\n<header class="top">`);
  if (html.includes(COMING_SOON)) html = swap(html, COMING_SOON, `${TBYM_LINK}.`);

  // The player, from this site.
  html = swap(html, '<iframe src="player.html"', `<iframe src="${unitPath(unit)}/player"`);

  // Links that were placeholders in the reviewed pages.
  html = swap(html, `<a ${PLACEHOLDER}>Need help?</a>`, '<a href="/contact">Need help?</a>');
  const help = `<a ${PLACEHOLDER}>Finding Help Where You Live</a>`;
  const helpCount = html.split(help).length - 1;
  if (helpCount < 1 || helpCount > 2) throw new Error(`${unit.slug}: expected one or two Finding Help links, found ${helpCount}.`);
  html = swap(html, help, `<a href="${HELP_PATH}" target="_blank" rel="noopener">Finding Help Where You Live</a>`, helpCount);
  // In-worksheet mentions that were plain bold text in the reviewed pages become links too.
  html = html.split("<b>Finding Help Where You Live</b>").join(`<a href="${HELP_PATH}" target="_blank" rel="noopener"><b>Finding Help Where You Live</b></a>`);
  const leave = `<a ${PLACEHOLDER}>Leave this page</a>`;
  if (html.includes(leave)) {
    html = swap(
      html,
      leave,
      `<a href="${NEUTRAL_DESTINATION}" rel="noreferrer" onclick="location.replace(this.href);return false">Leave this page</a>`
    );
  }
  if (html.includes(PLACEHOLDER)) throw new Error(`${unit.slug}: a placeholder link is left.`);

  // Finish: "I have completed this lesson" saves progress, then shows the
  // page's own thank-you line, a link back to the course page and, except on
  // the last lesson, a link on to the next one.
  const finishButton =
    `<button class="btn" onclick="this.parentNode.querySelector('.done').style.display='inline'">I have completed this lesson</button>`;
  const idx = BYSY_NEW_UNITS.indexOf(unit);
  const next = BYSY_NEW_UNITS[idx + 1];
  const done = completed.has(unit.slug);
  html = swap(html, finishButton, `<button class="btn" id="bysy-done">${done ? "✓ Completed" : "I have completed this lesson"}</button>`);
  const links =
    `<span data-bysy class="bysy-next" style="display:${done ? "flex" : "none"};gap:10px;flex-wrap:wrap;margin-top:10px;width:100%">` +
    `<a class="btn alt" style="text-decoration:none" href="${BYSY_NEW_PATH}">${next ? "Stop here for today" : "Back to the course page"}</a>` +
    (next ? `<a class="btn" style="text-decoration:none" href="${unitPath(next)}">Continue to ${escapeHtml(next.label)} ›</a>` : "") +
    `</span>`;
  const doneSpans = html.match(/<span class="done">[\s\S]*?<\/span><\/div><\/section>/g) ?? [];
  if (doneSpans.length !== 1) throw new Error(`${unit.slug}: expected one finish line, found ${doneSpans.length}.`);
  const doneSpan = doneSpans[0].replace(/<\/div><\/section>$/, "");
  html = swap(
    html,
    doneSpan,
    (done ? doneSpan.replace('<span class="done">', '<span class="done" style="display:inline">') : doneSpan) + links
  );

  html = beforeBodyEnd(
    html,
    `<p data-bysy id="bysy-done-error" role="alert" hidden style="position:fixed;left:12px;right:12px;bottom:12px;background:#7a2e1f;color:#fff;padding:10px 14px;border-radius:10px;font:600 15px/1.4 system-ui,sans-serif;z-index:99">That did not save. Please check your connection and try again.</p>
<script data-bysy>
(function(){
  var btn=document.getElementById('bysy-done'),err=document.getElementById('bysy-done-error'),fin=btn.parentNode;
  btn.onclick=function(){
    btn.disabled=true;err.hidden=true;
    fetch(${JSON.stringify(`${unitPath(unit)}/complete`)},{method:'POST',credentials:'same-origin'})
      .then(function(r){if(!r.ok)throw new Error(r.status);
        fin.querySelector('.done').style.display='inline';fin.querySelector('.bysy-next').style.display='flex';btn.textContent='✓ Completed';})
      .catch(function(){err.hidden=false;})
      .then(function(){btn.disabled=false;});
  };
})();
</script>`
  );
  return html;
}

/** The course's contents page. */
export function homeHtml(completed: Set<string>): string {
  const count = BYSY_NEW_UNITS.filter((u) => completed.has(u.slug)).length;
  const sections = PARTS.map((p) => {
    const rows = BYSY_NEW_UNITS.filter((u) => u.part === p.n)
      .map((u) => {
        const done = completed.has(u.slug);
        return `<li><a href="${unitPath(u)}"><span class="lab">${escapeHtml(u.label)}</span><span class="t">${escapeHtml(u.title)}</span><span class="st${done ? " done" : ""}">${done ? "✓ Completed" : "Teaching lesson · about 20 minutes"}</span></a></li>`;
      })
      .join("");
    return `<h2>${escapeHtml(p.title)}</h2><ul>${rows}</ul>`;
  }).join("");
  const finished = count === BYSY_NEW_UNITS.length
    ? `<p class="fin">✓ Completed ${COURSE}. Next, when you are ready: ${TBYM_LINK}.</p>`
    : "";
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${COURSE}</title>${NOINDEX}${SELF_HOSTED_FONTS}${NEVER_STALE}
<style data-bysy>
body{margin:0;background:#fbf6ea;color:#2b3445;font:17px/1.55 'Source Sans 3',system-ui,sans-serif}
header{background:linear-gradient(180deg,#f7efdf,#f3e3c4);padding:34px 16px 34px}
.w{max-width:760px;margin:0 auto}
h1{font:600 clamp(26px,5vw,38px)/1.2 'Source Serif 4',serif;margin:6px 0 8px}
h2{font:600 15px/1.3 'Source Sans 3',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6a24;margin:26px 0 10px}
.k{letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#8a6a24;margin:0}
p.s{margin:0;color:#5a6577}
main{padding:22px 16px 40px}
.note{background:#fffaf0;border:1px solid #e3d6b8;border-radius:12px;padding:12px 14px;font-size:15px;margin-bottom:12px}
.safe{background:#fbeee8;border:1px solid #e3c2b6;border-left:6px solid #b0583f;border-radius:12px;padding:12px 14px;font-size:15px;margin-bottom:12px}
.safe a,.note a{color:#8a6a24;font-weight:700}
.prog{font-size:15px;color:#5a6577;margin:0 0 6px}
.lg{background:#fffaf0;border:1px solid #e3d6b8;border-radius:12px;padding:12px 14px;font-size:15px;margin:0 0 12px}
.lg a{color:#8a6a24;font-weight:700}
.fin{background:#e3ecdf;border:1px solid #b6c99a;border-radius:12px;padding:12px 14px;font-weight:600;color:#2f6b3a}
ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
li a{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;background:#fffaf0;border:1px solid #e3d6b8;border-radius:14px;padding:16px;color:inherit;text-decoration:none}
li a:hover,li a:focus-visible{border-color:#8a6a24;outline:none;box-shadow:0 0 0 3px rgba(138,106,36,.25)}
.lab{grid-row:span 2;font:600 13px/1.2 'Source Sans 3',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a6a24;padding-top:4px}
.t{font:600 19px/1.3 'Source Serif 4',serif}
.st{font-size:14px;color:#5a6577}.st.done{color:#2f6b3a;font-weight:600}
footer{text-align:center;font-size:13px;color:#5a6577;padding:0 16px 30px}
footer a{color:#8a6a24;display:inline-flex;align-items:center;min-height:44px;padding:0 4px}
</style></head><body>
<header><div class="w"><p class="k">Faithful Path · Membership course</p><h1>${COURSE}</h1><p class="s">A Christian course on dating with wisdom: 21 illustrated teaching lessons, each about 20 minutes, from the book <i>Before You Say Yes</i>.</p></div></header>
<main class="w"><div class="note">${"Take the lessons in order, one at a time, at your own pace. Your progress is saved as you finish each lesson."}</div>
<div class="safe"><b>If you are afraid of the person you are dating</b>, or have been threatened, hurt, pressured or watched, go to <a href="${HELP_PATH}" target="_blank" rel="noopener">Finding Help Where You Live</a> first, on a device they cannot access. If you are in immediate danger, contact emergency services.</div>
<p class="prog">${count} of ${BYSY_NEW_UNITS.length} lessons completed. The reflections on each lesson page are private: nothing you type there is saved.</p>
${finished}
<p class="lg"><b>Leading a group, or walking with a young adult?</b> The Leader's Guide is for small-group leaders, pastors, mentors and parents. <a href="${leadersGuideHref}">⬇ Leader's Guide (PDF)</a></p>
${sections}</main>
<footer><a href="/members">Back to your membership</a> · <a href="/contact">Questions? Contact us</a></footer>
</body></html>`;
}

export function bysyHtmlResponse(html: string): Response {
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
