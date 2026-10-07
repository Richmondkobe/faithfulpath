import type { CourseProgress } from "@/lib/fj-progress";
import {
  COURSES,
  SERIES_PATH,
  chapterFile,
  chapterNumber,
  coursePath,
  downloadPath,
  tabTitle,
  type FjCourse,
  type FjLesson,
} from "@/lib/following-jesus";
import { beforeBodyEnd, beforeHeadEnd, escapeHtml, readCoursePage, swap, websitePage, websitePlayer } from "@/lib/fj-html";

// The lesson, player and completion pages as the website serves them. Each
// change is one of those listed in content/courses/following-jesus/README.md;
// anything that touches what the learner reads belongs in the files, not here.

const DEAD_LINK = '<a class="btn" href="#" onclick="return false">';

/*
 * Print rules, asked for by Richmond on 7 October 2026 after printing My First
 * Steps ("layout only, no wording changes"). They apply only on paper; nothing
 * changes on screen, and the reviewed files are untouched.
 *
 * Both pages:
 *  1. A card may run across pages, so a long one (Look back, the transcript
 *     cards) starts under the header instead of leaving page 1 blank. Small
 *     pieces inside it (a lesson row, a First Step, a checkbox) stay whole.
 *  2. An empty box prints empty, not with its grey hint text, which on paper
 *     reads as an answer.
 *  3. No resize handles on the boxes.
 *  4. The dark closing card prints in dark ink on white: the browser drops the
 *     dark background when printing, which left its pale text near invisible.
 *  5. Ticks, and chosen options, print with their colour in every browser.
 *  6. A long answer prints in full. A text box keeps its screen height on
 *     paper and cuts off whatever does not fit, so each box has a plain copy
 *     of its text beside it, hidden on screen and printed in its place, in
 *     the same bordered box, growing to fit. An empty one keeps the box's
 *     height, so there is still room to write by hand.
 */
const PRINT_BOTH = `
.card{break-inside:auto!important}
.card h2{break-after:avoid}
.lessons li,.stepcard,.checks2 li,.plan li,.parts label,.how li,.assign li,.talk li,.two>div{break-inside:avoid}
textarea::placeholder,input::placeholder{color:transparent!important;opacity:0!important}
textarea{resize:none!important}
.finish{background:#fff!important;border:1px solid var(--line)!important}
.finish h2,.finish .sub,.finish p{color:#000!important}
input[type=checkbox],input[type=radio]{-webkit-print-color-adjust:exact;print-color-adjust:exact}
textarea{display:none!important}
.fj-print-text{display:block!important}`;

/** Screen styles for the print copies of the text boxes: never shown on screen. */
const PRINT_COPY_STYLE = `.fj-print-text{display:none;white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;font-weight:400;line-height:1.5;color:#000;border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-height:84px;break-inside:avoid}`;

// Keeps a copy of each text box's words beside it, for printing. Synced as
// the learner types, once everything has loaded (after their saved answers
// are put back), and just before printing.
const PRINT_COPY_SCRIPT = `<script data-fj>
(function(){
  function sync(){
    document.querySelectorAll('main textarea').forEach(function(t){
      var c=t.nextElementSibling;
      if(!c||!c.classList.contains('fj-print-text')){
        c=document.createElement('div');c.className='fj-print-text';c.setAttribute('data-fj','');c.setAttribute('aria-hidden','true');
        t.parentNode.insertBefore(c,t.nextSibling);
        t.addEventListener('input',function(){c.textContent=t.value;});
      }
      c.textContent=t.value;
    });
  }
  addEventListener('load',sync);
  addEventListener('beforeprint',sync);
})();
</script>`;

/*
 * The lessons had no print rules at all, so they printed the dark header in
 * pale ink and the player as an empty grey band. These are My First Steps' own
 * print rules, with one difference: the footer's ESV notice stays on the page
 * (the lessons quote Scripture throughout), and only "Need help?" is hidden.
 */
const PRINT_LESSON = `
.top .bar,.player,.btns,.noprint{display:none!important}
body{background:#fff}
.card{box-shadow:none}
.top{background:#fff;color:#000}
.top *{color:#000!important}
footer a{display:none}`;

function withPrintRules(html: string, lesson: boolean): string {
  const withStyle = beforeHeadEnd(
    html,
    `<style data-fj>${PRINT_COPY_STYLE}\n@media print{${lesson ? PRINT_LESSON : ""}${PRINT_BOTH}\n}</style>`
  );
  return beforeBodyEnd(withStyle, PRINT_COPY_SCRIPT);
}

export function lessonPath(course: FjCourse, lesson: FjLesson): string {
  return `${coursePath(course)}/${lesson.slug}`;
}

export function audioApiPath(course: FjCourse, lesson: FjLesson): string {
  return `/api/courses/following-jesus/${course.slug}/${lesson.slug}/audio`;
}

/** Where a lesson's "Continue to …" leads: the next lesson, or the completion page. */
function nextPath(course: FjCourse, lesson: FjLesson): string {
  const next = course.lessons[lesson.number];
  if (next) return lessonPath(course, next);
  if (course.completionPage) return `${coursePath(course)}/${course.completionPage.slug}`;
  return coursePath(course);
}

export function completeApiPath(course: FjCourse, lesson: FjLesson): string {
  return `/api/courses/following-jesus/${course.slug}/${lesson.slug}/complete`;
}

const FINISH = '<section class="card finish" id="finish" aria-labelledby="h-finish">';

/*
 * The eight dashes at the top of a lesson and of the completion page. In the
 * files they mark where the page sits (Lesson 7 shows seven gold, My First
 * Steps all eight), which in Richmond's test read as progress: with Lessons 6
 * and 7 not done, Lesson 8 and My First Steps still showed eight gold. On the
 * website a dash is gold only for a lesson the learner has completed, and the
 * lesson's own dash lights when they mark it.
 */
function progressDashes(html: string, course: FjCourse, progress: CourseProgress): string {
  const found = html.match(/(<span class="steps8"[^>]*>)((?:<i(?: class="on")?><\/i>)+)(<\/span>)/);
  if (!found) throw new Error("A Following Jesus page has no progress dashes.");
  if ((found[2].match(/<i/g) ?? []).length !== course.lessons.length) {
    throw new Error("A Following Jesus page has the wrong number of progress dashes.");
  }
  const dashes = course.lessons.map((l) => (progress.completed.has(l.slug) ? '<i class="on"></i>' : "<i></i>")).join("");
  return swap(html, found[0], `${found[1]}${dashes}${found[3]}`);
}

/*
 * "Well done. Lesson 8 is complete. You have completed Begin!" is one line in
 * the Lesson 8 file, shown whenever Lesson 8 is marked. The second sentence is
 * true only once every lesson is complete, so it is shown only then (including
 * straight after the tap that completes the course). data-fj-changed tells
 * scripts/verify-fj-pages.mjs this line was changed on purpose; it checks the
 * change against its own list.
 */
function courseDoneSentence(html: string, course: FjCourse, lesson: FjLesson, progress: CourseProgress): string {
  const line = `<p>Well done. Lesson ${lesson.number} is complete. You have completed ${course.title}!</p>`;
  if (!html.includes(line)) return html;
  const hidden = progress.courseCompletedAt ? "" : " hidden";
  return swap(
    html,
    line,
    `<p data-fj-changed>Well done. Lesson ${lesson.number} is complete.<span data-fj id="fj-course-done"${hidden}> You have completed ${course.title}!</span></p>`
  );
}
const DONE_BUTTON =
  '<div class="btns mark" style="justify-content:center"><button class="btn gold" id="done">✓ I have completed this lesson</button></div>';

export async function lessonPage(course: FjCourse, lesson: FjLesson, progress: CourseProgress): Promise<string> {
  const completed = progress.completed.has(lesson.slug);
  const n = lesson.number;
  const two = lesson.slug.slice(-2);
  let html = websitePage(await readCoursePage(course, `${lesson.slug}/lesson.html`), {
    title: tabTitle(`Lesson ${n}: ${lesson.title}`),
    indexable: false,
  });

  // The player, from this site, behind the same purchase check as the lesson.
  html = swap(html, '<iframe src="player.html"', `<iframe src="${lessonPath(course, lesson)}/player"`);

  // "Go deeper": the chapter cut from the book, and the worksheet. The button
  // names the book's own chapter: Establish's Lesson 1 is Chapter 9.
  const chapter = chapterNumber(course, lesson);
  html = swap(
    html,
    `${DEAD_LINK}⬇ Chapter ${chapter} (PDF)</a>`,
    `<a class="btn" href="${downloadPath(course, chapterFile(course, lesson))}">⬇ Chapter ${chapter} (PDF)</a>`
  );
  html = swap(
    html,
    `${DEAD_LINK}⬇ Lesson ${n} worksheet</a>`,
    `<a class="btn" href="${downloadPath(course, `worksheet-${two}.pdf`)}">⬇ Lesson ${n} worksheet</a>`
  );

  // The two buttons after "I have completed this lesson".
  const continueLabel = course.lessons[n]
    ? `Continue to Lesson ${n + 1} ›`
    : `Continue to ${course.completionPage?.title ?? "the course"} ›`;
  // Establish's Lesson 10 file says "Continue to Lesson 11 ›", and there is no
  // Lesson 11. Richmond approved showing the completion page's name instead
  // (7 October 2026); data-fj-changed lets the page check hold it to its list.
  const slip = `Continue to Lesson ${n + 1} ›`;
  const fileLabel = !course.lessons[n] && html.includes(`<button class="btn">${slip}</button>`) ? slip : continueLabel;
  html = swap(
    html,
    `<button class="btn gold">Stop here for today</button><button class="btn">${fileLabel}</button>`,
    `<a class="btn gold" href="${coursePath(course)}">Stop here for today</a>` +
      `<a class="btn"${fileLabel === continueLabel ? "" : " data-fj-changed"} href="${nextPath(course, lesson)}">${continueLabel}</a>`
  );

  // "✓ I have completed this lesson" saves before it says "Well done". If the
  // save fails, it says so and the button stays, rather than showing a
  // completion that was never recorded. A lesson already completed opens with
  // "Well done" and its two buttons showing.
  if (completed) html = swap(html, FINISH, FINISH.replace('class="card finish"', 'class="card finish done"'));
  html = progressDashes(html, course, progress);
  html = courseDoneSentence(html, course, lesson, progress);

  // The dashes carry a spoken label ("Lesson 1 of 8") on a plain <span>, which
  // screen readers are not meant to read a label from, so some skipped it.
  // role="img" makes it a labelled picture; nothing changes on screen.
  html = swap(html, '<span class="steps8" aria-label=', '<span class="steps8" role="img" aria-label=');
  html = swap(
    html,
    DONE_BUTTON,
    `${DONE_BUTTON}\n  <p data-fj class="sub mark" id="fj-done-error" role="alert" hidden>That did not save. Please check your connection and try again.</p>`
  );
  html = beforeBodyEnd(
    html,
    `<script data-fj>
(function(){
  var btn=document.getElementById('done'),fin=document.getElementById('finish'),err=document.getElementById('fj-done-error');
  btn.onclick=function(){
    btn.disabled=true;err.hidden=true;
    fetch(${JSON.stringify(completeApiPath(course, lesson))},{method:'POST',credentials:'same-origin'})
      .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
      .then(function(res){
        var dash=document.querySelectorAll('.steps8 i')[${lesson.number - 1}];if(dash)dash.classList.add('on');
        var whole=document.getElementById('fj-course-done');if(whole)whole.hidden=!res.courseCompleted;
        fin.classList.add('done');
      })
      .catch(function(){err.hidden=false;})
      .then(function(){btn.disabled=false;});
  };
})();
</script>`
  );

  return withPrintRules(html, true);
}

/**
 * The timed slides, with the recording at a signed URL in place of the file
 * name. If that URL lapses before the recording has loaded — a phone paused
 * for over an hour — the player asks for a fresh one and carries on from the
 * same second, rather than falling silent.
 */
export async function playerPage(course: FjCourse, lesson: FjLesson, audioUrl: string): Promise<string> {
  let html = websitePlayer(
    await readCoursePage(course, `${lesson.slug}/player.html`),
    tabTitle(`Lesson ${lesson.number} teaching`)
  );
  // The file name in the reviewed player: begin-lesson-01.mp3, establish-lesson-01.mp3.
  html = swap(html, `src="${course.slug}-${lesson.slug}.mp3"`, `src="${escapeHtml(audioUrl)}"`);

  return beforeBodyEnd(
    html,
    `<script data-fj>
(function(){
  var aud=document.getElementById('aud'),tries=0,wanted=false;
  aud.addEventListener('play',function(){wanted=true;});
  aud.addEventListener('pause',function(){if(!aud.error)wanted=false;});
  aud.addEventListener('playing',function(){tries=0;});
  aud.addEventListener('error',function(){
    if(tries++>=3)return;
    var at=aud.currentTime,resume=wanted;
    fetch(${JSON.stringify(audioApiPath(course, lesson))},{credentials:'same-origin',cache:'no-store'})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(j){
        if(!j||!j.url)return;
        aud.addEventListener('loadedmetadata',function once(){
          aud.removeEventListener('loadedmetadata',once);
          aud.currentTime=at;
          if(resume)aud.play().catch(function(){});
        });
        aud.src=j.url;aud.load();
      })
      .catch(function(){});
  });
})();
</script>`
  );
}

export async function completionPage(course: FjCourse, progress: CourseProgress): Promise<string> {
  const page = course.completionPage;
  if (!page) throw new Error(`${course.title} has no completion page.`);

  let html = websitePage(await readCoursePage(course, `${page.slug}.html`), {
    title: tabTitle(page.title),
    indexable: false,
  });
  html = progressDashes(html, course, progress);

  // "Continue to Book 2: Establish ›": to the next course once it is
  // launched and listed, and until then the series page, where it shows as
  // coming soon (Richmond, 7 October 2026).
  const nextCourse = COURSES.find((c) => c.book === course.book + 1);
  const nextButton = nextCourse && `<button class="btn gold">Continue to Book ${nextCourse.book}: ${nextCourse.title} ›</button>`;
  if (nextCourse && nextButton) {
    const href = nextCourse.launched && nextCourse.listed ? coursePath(nextCourse) : SERIES_PATH;
    html = swap(html, nextButton, `<a class="btn gold" href="${href}">Continue to Book ${nextCourse.book}: ${nextCourse.title} ›</a>`);
  }
  html = swap(
    html,
    '<button class="textlink" style="color:#d5dae4">Back to the course</button>',
    `<a class="textlink" style="color:#d5dae4" href="${coursePath(course)}">Back to the course</a>`
  );
  return withPrintRules(html, false);
}
