import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/course-media";
import { getLearner, type Learner } from "@/lib/following-jesus-access";
import { getMemberByEmail, isActive } from "@/lib/members";
import { beforeBodyEnd, beforeHeadEnd, escapeHtml, swap } from "@/lib/fj-html";

/*
 * The Christian Spiritual Reset, new edition: a hidden test course.
 *
 * Built alongside the live Reset (/members/courses/christian-spiritual-reset),
 * never instead of it. Three rules keep the two apart:
 *
 *  1. Its own course_slug, "christian-spiritual-reset-new". It only ever reads
 *     and writes course_progress rows with that slug, through the member's own
 *     session (RLS keeps them to their own rows). It never reads or writes the
 *     live course's progress, reflections, quiz scores or the journal.
 *  2. Its own folders: content/courses/christian-spiritual-reset-new/ for the
 *     pages and PDFs, course-media/audio/christian-spiritual-reset-new/ for the
 *     recordings. Nothing of the live course's is replaced.
 *  3. Not listed. Nothing on the site links here, the pages say noindex, and
 *     it is not in the sitemap. Members only, like the live course.
 *
 * Removing it: delete this file, app/members/courses/christian-spiritual-reset-new/
 * and content/courses/christian-spiritual-reset-new/. Nothing else depends on it.
 *
 * The HTML is Richmond's reviewed pilot, served as the file itself, as the
 * Following Jesus pages are. Changes on the way out are exact swaps that must
 * match a set number of times (swap() in fj-html.ts), listed in the README.
 */

export const RESET_NEW_KEY = "christian-spiritual-reset-new";
export const RESET_NEW_PATH = `/members/courses/${RESET_NEW_KEY}`;
const CONTENT_ROOT = join(process.cwd(), "content", "courses", RESET_NEW_KEY);

export type ResetNewUnit = {
  slug: "lesson-01" | "session-01";
  kind: "lesson" | "session";
  label: string;
  title: string;
  /** The teaching recording, in course-media/audio/christian-spiritual-reset-new/. */
  narration: string;
  /** Other recordings the page plays (guided prayer, silence timer). */
  pageAudio: string[];
  /** The page's own words on its finish buttons, and where "Continue" leads. */
  finish: { stop: string; next: string };
  downloads: { label: string; file: string }[];
};

export const RESET_NEW_UNITS: ResetNewUnit[] = [
  {
    slug: "lesson-01",
    kind: "lesson",
    label: "Lesson 1",
    title: "When Your Body Keeps Going but Your Soul Is Tired",
    narration: "reset-lesson-01.mp3",
    pageAudio: [],
    finish: { stop: "Stop here for today", next: "Continue to Lesson 2 ›" },
    downloads: [
      { label: "⬇ Chapter 1 (PDF)", file: "chapter-01.pdf" },
      { label: "⬇ Lesson 1 worksheet", file: "worksheet-lesson-01.pdf" },
      { label: "If you are not sure you belong to Christ", file: "belong-to-christ.pdf" },
    ],
  },
  {
    slug: "session-01",
    kind: "session",
    label: "Session 1",
    title: "Come As You Are",
    narration: "reset-session-01.mp3",
    pageAudio: [
      "guided-prayer-01.mp3",
      "timer-opening-10.mp3",
      "timer-opening-15.mp3",
      "timer-closing.mp3",
      "guided-silence-5.mp3",
      "guided-silence-10.mp3",
      "guided-silence-15.mp3",
    ],
    finish: { stop: "Rest before Session 2", next: "Continue to Session 2 ›" },
    downloads: [
      { label: "⬇ Session One (PDF)", file: "session-01.pdf" },
      { label: "⬇ Session 1 workbook pages", file: "workbook-session-01.pdf" },
    ],
  },
];

export function findUnit(slug: string): ResetNewUnit | null {
  return RESET_NEW_UNITS.find((u) => u.slug === slug) ?? null;
}

export const unitPath = (u: ResetNewUnit) => `${RESET_NEW_PATH}/${u.slug}`;
export const downloadHref = (file: string) => `${RESET_NEW_PATH}/downloads/${file}`;
export const DOWNLOAD_FILES = new Set(RESET_NEW_UNITS.flatMap((u) => u.downloads.map((d) => d.file)));

/* ----------------------------------------------------------------- access */

/**
 * The signed-in member with an active membership, as the live course asks for;
 * otherwise null. Signed out and lapsed both come back null.
 */
export async function activeMemberLearner(): Promise<Learner | null> {
  const learner = await getLearner();
  if (!learner) return null;
  const member = await getMemberByEmail(learner.email);
  return isActive(member) ? learner : null;
}

/* --------------------------------------------------------------- progress */

/** Units of this edition the member has completed. Read through their own session. */
export async function getCompleted(): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_progress")
    .select("lesson_slug")
    .eq("course_slug", RESET_NEW_KEY)
    .not("completed_at", "is", null);
  if (error) throw new Error(`Could not load progress: ${error.message}`);
  return new Set((data ?? []).map((r) => r.lesson_slug));
}

/**
 * Mark a unit complete for this edition only. Marking it again keeps the
 * first date. The course_slug is the constant above, never taken from a request.
 */
export async function completeUnit(learner: Learner, unit: ResetNewUnit): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from("course_progress")
    .select("completed_at")
    .eq("course_slug", RESET_NEW_KEY)
    .eq("lesson_slug", unit.slug)
    .maybeSingle();
  if (readError) throw new Error(`Could not read progress: ${readError.message}`);
  if (existing?.completed_at) return;

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: learner.userId,
      course_slug: RESET_NEW_KEY,
      lesson_slug: unit.slug,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(`Could not save progress: ${error.message}`);
}

/* ------------------------------------------------------------------ media */

/** As the rest of the site: an hour. Each play asks for a fresh link, so a page left open still works. */
const AUDIO_SECONDS = 60 * 60;

/** A signed URL for one of a unit's recordings, or null if it is not one of them or not uploaded. */
export async function signedUnitAudio(unit: ResetNewUnit, file: string, download = false): Promise<string | null> {
  if (file !== unit.narration && !unit.pageAudio.includes(file)) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(`audio/${RESET_NEW_KEY}/${file}`, AUDIO_SECONDS, download ? { download: file } : undefined);
  if (error) {
    if (!/not found|does not exist/i.test(error.message)) console.error(`Could not sign ${file}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/* ------------------------------------------------------------------ pages */

export async function readUnitFile(unit: ResetNewUnit, name: "page.html" | "player.html"): Promise<string> {
  return readFile(join(CONTENT_ROOT, unit.slug, name), "utf8");
}

export async function readDownload(file: string): Promise<Buffer | null> {
  if (!DOWNLOAD_FILES.has(file)) return null;
  return readFile(join(CONTENT_ROOT, "downloads", file));
}

const GOOGLE_FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Source+Sans+3:wght@400;600;700&display=swap">';
const FONT_PATH = "/courses/following-jesus/fonts";
const SELF_HOSTED_FONTS = `<style data-reset>
@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:400 600;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-normal.woff2) format('woff2')}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:400;font-display:swap;src:url(${FONT_PATH}/fj-source-serif-4-italic.woff2) format('woff2')}
@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:400 700;font-display:swap;src:url(${FONT_PATH}/fj-source-sans-3-normal.woff2) format('woff2')}
</style>`;
const NOINDEX = '<meta data-reset name="robots" content="noindex, nofollow">';
const NEVER_STALE =
  "<script data-reset>addEventListener('pageshow',function(e){if(e.persisted)location.reload();});</script>";
const DEAD = 'href="#" onclick="return false"';

function retitle(html: string, title: string): string {
  const titles = html.match(/<title>[^<]*<\/title>/g) ?? [];
  if (titles.length !== 1) throw new Error(`Expected one <title>, found ${titles.length}.`);
  return swap(html, titles[0], `<title>${escapeHtml(title)}</title>`);
}

/** The teaching player, framed by the unit page. Fonts from this site, and the recording from storage. */
export function playerHtml(unit: ResetNewUnit, raw: string): string {
  let html = retitle(swap(raw, GOOGLE_FONTS, SELF_HOSTED_FONTS), `${unit.label} · The Christian Spiritual Reset`);
  html = swap(html, `<audio id="aud" src="${unit.narration}"`, `<audio id="aud" src="${unitPath(unit)}/audio/${unit.narration}"`);
  return beforeHeadEnd(html, NOINDEX);
}

const TEST_BANNER = `<div data-reset style="background:#8a6a24;color:#fff;text-align:center;font:600 13px/1.4 'Source Sans 3',system-ui,sans-serif;padding:6px 12px">Test edition · not yet published · <a href="${RESET_NEW_PATH}" style="color:#fff">Course page</a></div>`;

/** The unit page as the website serves it. */
export function unitHtml(unit: ResetNewUnit, raw: string, completed: Set<string>): string {
  let html = retitle(swap(raw, GOOGLE_FONTS, SELF_HOSTED_FONTS), `${unit.label}: ${unit.title} · The Christian Spiritual Reset`);
  html = beforeHeadEnd(html, NOINDEX);
  html = beforeHeadEnd(html, NEVER_STALE);

  // The preview's note about keeping the files together.
  const notes = html.match(/ *<div class="preview-note">[^<]*<\/div>\n?/g) ?? [];
  if (notes.length !== 1) throw new Error(`Expected one preview note, found ${notes.length}.`);
  html = swap(html, notes[0], "");
  html = swap(html, '<header class="top">', `${TEST_BANNER}\n<header class="top">`);

  // The player, from this site.
  html = swap(html, '<iframe src="player.html"', `<iframe src="${unitPath(unit)}/player"`);

  // Links that were placeholders in the preview.
  html = swap(html, `<a ${DEAD}>Need help?</a>`, '<a href="/contact">Need help?</a>');
  html = swap(
    html,
    `<a ${DEAD}>Finding Help Where You Live</a>`,
    '<a href="/before-you-say-yes/resources" target="_blank" rel="noopener">Finding Help Where You Live</a>'
  );
  for (const d of unit.downloads) {
    html = swap(html, `<a class="btn" ${DEAD}>${d.label}</a>`, `<a class="btn" href="${downloadHref(d.file)}">${d.label}</a>`);
  }

  // The session's own recordings: guided prayer and the silence timer.
  for (const file of unit.pageAudio) {
    const n = html.split(`"${file}"`).length - 1;
    if (n > 0) html = swap(html, `"${file}"`, `"${unitPath(unit)}/audio/${file}"`, n);
    else if (!/^guided-silence-(5|15)\.mp3$/.test(file)) throw new Error(`${unit.slug} does not use ${file}.`);
  }
  // "Download this recording" (the one-file guided silence) asks for a saved
  // copy: the file is on another domain, where the download attribute is ignored.
  if (unit.kind === "session") {
    html = swap(
      html,
      `<a class="sub" id="gsDl" href="${unitPath(unit)}/audio/guided-silence-10.mp3"`,
      `<a class="sub" id="gsDl" href="${unitPath(unit)}/audio/guided-silence-10.mp3?download=1"`
    );
    html = swap(html, "$('gsDl').setAttribute('href',u);", "$('gsDl').setAttribute('href',u+'?download=1');");
  }

  // Finish: the buttons become links. "Continue" goes to the next unit of this
  // edition; until that unit is built it goes back to the course page and says so.
  const home = RESET_NEW_PATH;
  if (unit.kind === "session") {
    html = swap(
      html,
      '<button class="btn ghost" onclick="return false">Stop here and come back later</button>',
      `<a class="btn ghost" href="${home}">Stop here and come back later</a>`
    );
  }
  const idx = RESET_NEW_UNITS.indexOf(unit);
  const nextUnit = RESET_NEW_UNITS[idx + 1];
  const builtNext = nextUnit && nextUnit.label === unit.finish.next.replace(/^Continue to | ›$/g, "");
  html = swap(
    html,
    `<button class="btn gold">${unit.finish.stop}</button><button class="btn">${unit.finish.next}</button>`,
    `<a class="btn gold" href="${home}">${unit.finish.stop}</a>` +
      (builtNext
        ? `<a class="btn" href="${unitPath(nextUnit)}">${unit.finish.next}</a>`
        : `<a class="btn" data-reset-changed href="${home}">Back to the course page ›</a>`)
  );

  if (completed.has(unit.slug)) {
    html = swap(html, '<section class="card finish" id="finish"', '<section class="card finish done" id="finish"');
  }

  // "✓ I have …" saves before it shows "complete". If the save fails, it says so.
  html = beforeBodyEnd(
    html,
    `<p data-reset id="reset-done-error" role="alert" hidden style="position:fixed;left:12px;right:12px;bottom:12px;background:#7a2e1f;color:#fff;padding:10px 14px;border-radius:10px;font:600 15px/1.4 system-ui,sans-serif;z-index:99">That did not save. Please check your connection and try again.</p>
<script data-reset>
(function(){
  var btn=document.getElementById('done'),fin=document.getElementById('finish'),err=document.getElementById('reset-done-error');
  btn.onclick=function(){
    btn.disabled=true;err.hidden=true;
    fetch(${JSON.stringify(`${unitPath(unit)}/complete`)},{method:'POST',credentials:'same-origin'})
      .then(function(r){if(!r.ok)throw new Error(r.status);fin.classList.add('done');})
      .catch(function(){err.hidden=false;})
      .then(function(){btn.disabled=false;});
  };
})();
</script>`
  );
  return html;
}

/** The test edition's own small contents page. */
export function homeHtml(completed: Set<string>): string {
  const rows = RESET_NEW_UNITS.map((u) => {
    const done = completed.has(u.slug);
    return `<li><a href="${unitPath(u)}"><span class="lab">${escapeHtml(u.label)}</span><span class="t">${escapeHtml(u.title)}</span><span class="st${done ? " done" : ""}">${done ? "✓ Completed" : u.kind === "session" ? "Retreat session" : "Teaching lesson"}</span></a></li>`;
  }).join("");
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Christian Spiritual Reset · Test edition</title>${NOINDEX}${SELF_HOSTED_FONTS}${NEVER_STALE}
<style data-reset>
body{margin:0;background:#f8f0e1;color:#1f2d4f;font:17px/1.55 'Source Sans 3',system-ui,sans-serif}
header{background:linear-gradient(180deg,#121d33,#1f2d4f 60%,#4b5f84);color:#f3ecd8;padding:34px 16px 40px}
.w{max-width:760px;margin:0 auto}
h1{font:600 clamp(26px,5vw,38px)/1.2 'Source Serif 4',serif;margin:6px 0 8px}
.k{letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#e3c98a;margin:0}
p.s{margin:0;opacity:.9}
main{padding:22px 16px 40px}
.note{background:#fff7e3;border:1px solid #e0d4b6;border-radius:12px;padding:12px 14px;font-size:15px;margin-bottom:18px}
ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
li a{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;background:#fffaf0;border:1px solid #e0d4b6;border-radius:14px;padding:16px;color:inherit;text-decoration:none}
li a:hover,li a:focus-visible{border-color:#8a6a24;outline:none;box-shadow:0 0 0 3px rgba(138,106,36,.25)}
.lab{grid-row:span 2;font:600 13px/1.2 'Source Sans 3',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a6a24;padding-top:4px}
.t{font:600 19px/1.3 'Source Serif 4',serif}
.st{font-size:14px;color:#5a6577}.st.done{color:#2f6b3a;font-weight:600}
footer{text-align:center;font-size:13px;color:#5a6577;padding:0 16px 30px}
footer a{color:#8a6a24}
</style></head><body>
${TEST_BANNER.replace(` · <a href="${RESET_NEW_PATH}" style="color:#fff">Course page</a>`, "")}
<header><div class="w"><p class="k">Faithful Path · Membership course</p><h1>The Christian Spiritual Reset</h1><p class="s">New edition: the two pilot units, for testing.</p></div></header>
<main class="w"><div class="note">Only members can open this page, and nothing on the site links here. Your progress here is kept apart from the current course, so nothing you have done there changes.</div>
<ul>${rows}</ul></main>
<footer><a href="/members">Back to your membership</a> · <a href="/contact">Need help?</a></footer>
</body></html>`;
}

export function resetHtmlResponse(html: string): Response {
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
