import {
  OFFERS,
  SERIES_PATH,
  canUpgrade,
  formatDay,
  lessonList,
  coursePath,
  downloadPath,
  offersOpenCourse,
  type FjCourse,
  type FjOffer,
  type FjOfferId,
} from "@/lib/following-jesus";
import { formatPrice } from "@/lib/products";
import { escapeHtml, swap } from "@/lib/fj-html";
import type { Learner } from "@/lib/following-jesus-access";
import type { CourseProgress } from "@/lib/fj-progress";

// What goes under a course's welcome page: the two ways to buy it and the
// sign-in, or, for someone who already has it, their way in. Written with the
// page's own classes (card, kicker, sub, btn) so it sits in the page's style,
// plus the few rules below for what the page has no class for.

const STYLE = `<style data-fj>
.fj-offers{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin:12px 0 6px}
.fj-offer{border:1px solid var(--line);border-radius:16px;padding:16px 18px;background:#fff;display:flex;flex-direction:column}
.fj-offer h3{margin:0;font-size:19px;line-height:1.3}
.fj-offer .fj-price{font-family:'Source Serif 4',serif;font-size:28px;margin:6px 0 2px;color:var(--navy)}
.fj-offer .fj-once{font-size:14px;color:var(--mute);margin:0 0 8px}
.fj-offer ul{margin:4px 0 14px;padding-left:1.2em;flex:1}.fj-offer li{margin:.25em 0}.fj-offer li::marker{color:var(--gold)}
.fj-offer form{margin:0}
.fj-who{font-size:15px;color:var(--mute);margin:14px 0 0}
.fj-who form{display:inline}
.fj-who button{background:none;border:0;padding:0;font:inherit;color:var(--gold-d);text-decoration:underline;cursor:pointer}
.fj-progress{list-style:none;margin:10px 0 16px;padding:0}
.fj-progress li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line)}
.fj-progress li:first-child{border-top:0}
.fj-progress a{color:var(--ink);text-decoration:none}.fj-progress a:hover{text-decoration:underline}
.fj-progress small{color:var(--gold-d);font-weight:700;margin-right:6px}
.fj-progress .fj-done{color:var(--gold-d);font-size:15px;white-space:nowrap}
.fj-upgrade{border-top:1px solid var(--line);margin-top:18px;padding-top:16px}
.fj-upgrade-text{margin:0 0 10px;color:var(--mute);font-size:16px}
.fj-upgrade form{margin:0}
.fj-notice{background:#fff;border:1px solid var(--gold-soft);border-left:4px solid var(--gold);border-radius:10px;padding:10px 14px;margin:6px 0 14px;color:var(--ink)}
.fj-finished{font-family:'Source Serif 4',serif;font-style:italic;color:var(--navy);margin:0 0 12px}
</style>`;

function offerCard(offer: FjOffer, items: string[], button: string): string {
  return `<div class="fj-offer">
   <h3>${escapeHtml(offer.title)}</h3>
   <p class="fj-price">${formatPrice(offer.priceCents)}</p>
   <p class="fj-once">One-time payment</p>
   <ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
   <form method="post" action="/api/courses/following-jesus/checkout">
    <input type="hidden" name="offer" value="${offer.id}">
    <button type="submit" class="btn gold">${button}</button>
   </form>
  </div>`;
}

function signOutForm(next: string): string {
  return `<form method="post" action="/api/courses/following-jesus/sign-out"><input type="hidden" name="next" value="${escapeHtml(next)}"><button type="submit">Sign out</button></form>`;
}

function buySection(course: FjCourse, learner: Learner | null): string {
  const here = coursePath(course);
  const signIn = `${SERIES_PATH}/sign-in?next=${encodeURIComponent(here)}`;

  const who = learner
    ? `<div class="fj-who">You are signed in as <b>${escapeHtml(learner.email)}</b>, and this email has not bought ${escapeHtml(course.title)}. If you paid with a different email, ${signOutForm(here)} and sign in with that one.</div>`
    : `<div class="fj-who">Already bought ${escapeHtml(course.title)}? <a href="${signIn}">Sign in</a> with the email you paid with.</div>`;

  return `
 <section data-fj class="card" id="buy" aria-labelledby="h-buy">
  <p class="kicker">Take the course</p>
  <h2 id="h-buy">Two ways to start</h2>
  <p class="sub">The Following Jesus courses are sold on their own, separately from the Faithful Path membership.</p>
  <div class="fj-offers">
   ${offerCard(
     OFFERS["following-jesus-begin"],
     ["All 8 Begin lessons, with narration and captions", "The chapter from the book and a worksheet for each lesson", "The Leader's Guide, to download"],
     `Buy Begin · ${formatPrice(OFFERS["following-jesus-begin"].priceCents)}`
   )}
   ${offerCard(
     OFFERS["following-jesus-all-four"],
     ["Begin, open straight away", "Establish, Grow and Multiply, each opening for you when it launches", "Each course's Leader's Guide"],
     `Buy all four · ${formatPrice(OFFERS["following-jesus-all-four"].priceCents)}`
   )}
  </div>
  ${who}
 </section>`;
}

/** For a Begin owner: the rest of the series at the difference. */
function upgradeOffer(): string {
  const offer = OFFERS["following-jesus-upgrade-all-four"];
  return `<div class="fj-upgrade">
   <p class="fj-upgrade-text">Establish, Grow and Multiply, each opening for you when it launches, with each course's Leader's Guide.</p>
   <form method="post" action="/api/courses/following-jesus/checkout">
    <input type="hidden" name="offer" value="${offer.id}">
    <button type="submit" class="btn gold">Upgrade to all four · ${formatPrice(offer.priceCents)}</button>
   </form>
  </div>`;
}

function ownerSection(
  course: FjCourse,
  learner: Learner,
  progress: CourseProgress,
  finishFirst: boolean,
  upgrade: boolean
): string {
  const base = coursePath(course);
  const next = course.lessons.find((l) => !progress.completed.has(l.slug));
  const left = course.lessons.filter((l) => !progress.completed.has(l.slug));

  // Sent back from the completion page, which opens only once every lesson
  // is complete: one line naming what is left.
  const notice =
    finishFirst && course.completionPage && !progress.courseCompletedAt && left.length
      ? `<p class="fj-notice" role="status">Finish ${
          left.length === course.lessons.length ? `all ${course.lessons.length} lessons` : lessonList(left)
        } to open ${escapeHtml(course.completionPage.title)}.</p>`
      : "";

  // Plain words only: which lessons are completed, nothing scored or counted.
  const list = course.lessons
    .map(
      (l) => `<li><a href="${base}/${l.slug}"><small>Lesson ${l.number}</small>${escapeHtml(l.title)}</a>${
        progress.completed.has(l.slug) ? '<span class="fj-done">✓ Completed</span>' : ""
      }</li>`
    )
    .join("");

  let lead: string;
  if (progress.courseCompletedAt) {
    const done = `<p class="fj-finished">You completed ${escapeHtml(course.title)} on ${formatDay(progress.courseCompletedAt)}.</p>`;
    lead = course.completionPage
      ? `${done}<div class="btns"><a class="btn gold" href="${base}/${course.completionPage.slug}">Go to ${escapeHtml(course.completionPage.title)} ›</a></div>`
      : done;
  } else if (next && next.number > 1) {
    lead = `<div class="btns"><a class="btn gold" href="${base}/${next.slug}">Continue with Lesson ${next.number} ›</a></div>`;
  } else {
    lead = `<div class="btns"><a class="btn gold" href="${base}/${course.lessons[0].slug}">Start Lesson 1 ›</a></div>`;
  }

  return `
 <section data-fj class="card" id="your-course" aria-labelledby="h-yours">
  <p class="kicker">Your course</p>
  <h2 id="h-yours">${escapeHtml(course.title)} is yours</h2>
  ${notice}
  ${lead}
  <ul class="fj-progress" aria-label="Your lessons">${list}</ul>
  <div class="btns"><a class="btn" href="${downloadPath(course, "leaders-guide.pdf")}">⬇ Download the Leader's Guide (PDF)</a></div>
  ${upgrade ? upgradeOffer() : ""}
  <div class="fj-who">Signed in as <b>${escapeHtml(learner.email)}</b>. ${signOutForm(base)}</div>
 </section>`;
}

/**
 * The welcome page as the website serves it. `html` has already had the
 * common swaps (fonts, preview note, help link).
 */
export function welcomePage(
  html: string,
  course: FjCourse,
  learner: Learner | null,
  offers: Set<FjOfferId>,
  progress: CourseProgress | null,
  { finishFirst = false }: { finishFirst?: boolean } = {}
): string {
  const owns = learner !== null && offersOpenCourse(offers, course);

  // The page's own "Start Lesson 1 ›": into the lesson for an owner, down to
  // the ways to buy for everyone else.
  const startHref = owns ? `${coursePath(course)}/${course.lessons[0].slug}` : "#buy";
  let out = swap(
    html,
    '<button class="btn gold">Start Lesson 1 ›</button>',
    `<a class="btn gold" href="${startHref}">Start Lesson 1 ›</a>`
  );

  // Under the page, just before the main column closes.
  out = swap(out, "</main>", `${
    owns && progress ? ownerSection(course, learner, progress, finishFirst, canUpgrade(offers)) : buySection(course, learner)
  }\n</main>`);
  return swap(out, "</head>", `${STYLE}</head>`);
}
