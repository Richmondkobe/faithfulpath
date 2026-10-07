import {
  COURSES,
  OFFERS,
  SERIES_PATH,
  singleOfferFor,
  upgradePriceCents,
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

/** "Begin", "Begin and Establish", "Establish, Grow and Multiply". */
function andList(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * What all four, or the upgrade, would add for this person, as card lines:
 * courses that open straight away (launched, and listed or the page they are
 * on), then the rest, opening as each launches. While Establish is unlisted
 * the Begin page reads exactly as it did before Establish existed.
 */
function seriesLines(course: FjCourse, skip: (c: FjCourse) => boolean): { now: string[]; later: string[] } {
  const rest = COURSES.filter((c) => !skip(c));
  const shown = (c: FjCourse) => c.launched && (c.listed || c.slug === course.slug);
  return { now: rest.filter(shown).map((c) => c.title), later: rest.filter((c) => !shown(c)).map((c) => c.title) };
}

function seriesItems(lines: { now: string[]; later: string[] }): string[] {
  const items: string[] = [];
  if (lines.now.length) items.push(`${andList(lines.now)}, open straight away`);
  if (lines.later.length) {
    items.push(lines.later.length === 1 ? `${lines.later[0]}, opening for you when it launches` : `${andList(lines.later)}, each opening for you when it launches`);
  }
  return items;
}

function checkoutForm(offer: FjOfferId, course: FjCourse, button: string): string {
  return `<form method="post" action="/api/courses/following-jesus/checkout">
    <input type="hidden" name="offer" value="${offer}">
    <input type="hidden" name="from" value="${course.slug}">
    <button type="submit" class="btn gold">${button}</button>
   </form>`;
}

function offerCard(
  offer: FjOffer,
  course: FjCourse,
  { price, once, items, button }: { price: number; once: string; items: string[]; button: string }
): string {
  return `<div class="fj-offer">
   <h3>${escapeHtml(offer.title)}</h3>
   <p class="fj-price">${formatPrice(price)}</p>
   <p class="fj-once">${once}</p>
   <ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
   ${checkoutForm(offer.id, course, button)}
  </div>`;
}

function signOutForm(next: string): string {
  return `<form method="post" action="/api/courses/following-jesus/sign-out"><input type="hidden" name="next" value="${escapeHtml(next)}"><button type="submit">Sign out</button></form>`;
}

/** Titles of the courses someone owns on their own, for "You already own …". */
function ownedSingly(offers: Set<FjOfferId>): string[] {
  return COURSES.filter((c) => {
    const single = singleOfferFor(c);
    return single !== null && offers.has(single.id);
  }).map((c) => c.title);
}

function buySection(course: FjCourse, learner: Learner | null, offers: Set<FjOfferId>): string {
  const here = coursePath(course);
  const signIn = `${SERIES_PATH}/sign-in?next=${encodeURIComponent(here)}`;
  const single = singleOfferFor(course);
  const upgradePrice = learner ? upgradePriceCents(offers) : null;

  const who = learner
    ? `<div class="fj-who">You are signed in as <b>${escapeHtml(learner.email)}</b>, and this email has not bought ${escapeHtml(course.title)}. If you paid with a different email, ${signOutForm(here)} and sign in with that one.</div>`
    : `<div class="fj-who">Already bought ${escapeHtml(course.title)}? <a href="${signIn}">Sign in</a> with the email you paid with.</div>`;

  const cards: string[] = [];
  if (single) {
    cards.push(
      offerCard(single, course, {
        price: single.priceCents,
        once: "One-time payment",
        items: [
          `All ${course.lessons.length} ${course.title} lessons, with narration and captions`,
          "The chapter from the book and a worksheet for each lesson",
          "The Leader's Guide, to download",
        ],
        button: `Buy ${escapeHtml(course.title)} · ${formatPrice(single.priceCents)}`,
      })
    );
  }

  // Someone who already owns a course on its own is offered the rest at the
  // difference; everyone else, the bundle.
  if (upgradePrice !== null) {
    const upgrade = OFFERS["following-jesus-upgrade-all-four"];
    cards.push(
      offerCard({ ...upgrade, title: OFFERS["following-jesus-all-four"].title }, course, {
        price: upgradePrice,
        once: `One-time payment. You already own ${escapeHtml(andList(ownedSingly(offers)))}.`,
        items: [...seriesItems(seriesLines(course, (c) => offersOpenCourse(offers, c))), "Each course's Leader's Guide"],
        button: `Upgrade to all four · ${formatPrice(upgradePrice)}`,
      })
    );
  } else {
    const all = OFFERS["following-jesus-all-four"];
    cards.push(
      offerCard(all, course, {
        price: all.priceCents,
        once: "One-time payment",
        items: [...seriesItems(seriesLines(course, () => false)), "Each course's Leader's Guide"],
        button: `Buy all four · ${formatPrice(all.priceCents)}`,
      })
    );
  }

  return `
 <section data-fj class="card" id="buy" aria-labelledby="h-buy">
  <p class="kicker">Take the course</p>
  <h2 id="h-buy">Two ways to start</h2>
  <p class="sub">The Following Jesus courses are sold on their own, separately from the Faithful Path membership.</p>
  <div class="fj-offers">
   ${cards.join("\n   ")}
  </div>
  ${who}
 </section>`;
}

/** For an owner of this course who does not have all four: the rest at the difference. */
function upgradeOffer(course: FjCourse, offers: Set<FjOfferId>, price: number): string {
  const lines = seriesItems(seriesLines(course, (c) => offersOpenCourse(offers, c)));
  return `<div class="fj-upgrade">
   <p class="fj-upgrade-text">${escapeHtml(lines.join(", and "))}, with each course's Leader's Guide.</p>
   ${checkoutForm("following-jesus-upgrade-all-four", course, `Upgrade to all four · ${formatPrice(price)}`)}
  </div>`;
}

function ownerSection(
  course: FjCourse,
  learner: Learner,
  progress: CourseProgress,
  finishFirst: boolean,
  offers: Set<FjOfferId>
): string {
  const upgradePrice = upgradePriceCents(offers);
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
  ${upgradePrice !== null ? upgradeOffer(course, offers, upgradePrice) : ""}
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
    owns && progress ? ownerSection(course, learner, progress, finishFirst, offers) : buySection(course, learner, offers)
  }\n</main>`);
  return swap(out, "</head>", `${STYLE}</head>`);
}
