import {
  SERIES_PATH,
  coursePath,
  downloadPath,
  tabTitle,
  type FjCourse,
  type FjLesson,
} from "@/lib/following-jesus";
import { beforeBodyEnd, escapeHtml, readCoursePage, swap, websitePage, websitePlayer } from "@/lib/fj-html";

// The lesson, player and completion pages as the website serves them. Each
// change is one of those listed in content/courses/following-jesus/README.md;
// anything that touches what the learner reads belongs in the files, not here.

const DEAD_LINK = '<a class="btn" href="#" onclick="return false">';

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
const DONE_BUTTON =
  '<div class="btns mark" style="justify-content:center"><button class="btn gold" id="done">✓ I have completed this lesson</button></div>';

export async function lessonPage(
  course: FjCourse,
  lesson: FjLesson,
  { completed }: { completed: boolean }
): Promise<string> {
  const n = lesson.number;
  const two = lesson.slug.slice(-2);
  let html = websitePage(await readCoursePage(course, `${lesson.slug}/lesson.html`), {
    title: tabTitle(`Lesson ${n}: ${lesson.title}`),
    indexable: false,
  });

  // The player, from this site, behind the same purchase check as the lesson.
  html = swap(html, '<iframe src="player.html"', `<iframe src="${lessonPath(course, lesson)}/player"`);

  // "Go deeper": the chapter cut from the book, and the worksheet.
  html = swap(
    html,
    `${DEAD_LINK}⬇ Chapter ${n} (PDF)</a>`,
    `<a class="btn" href="${downloadPath(course, `chapter-${two}.pdf`)}">⬇ Chapter ${n} (PDF)</a>`
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
  html = swap(
    html,
    `<button class="btn gold">Stop here for today</button><button class="btn">${continueLabel}</button>`,
    `<a class="btn gold" href="${coursePath(course)}">Stop here for today</a>` +
      `<a class="btn" href="${nextPath(course, lesson)}">${continueLabel}</a>`
  );

  // "✓ I have completed this lesson" saves before it says "Well done". If the
  // save fails, it says so and the button stays, rather than showing a
  // completion that was never recorded. A lesson already completed opens with
  // "Well done" and its two buttons showing.
  if (completed) html = swap(html, FINISH, FINISH.replace('class="card finish"', 'class="card finish done"'));
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
      .then(function(r){if(!r.ok)throw new Error(r.status);fin.classList.add('done');})
      .catch(function(){err.hidden=false;})
      .then(function(){btn.disabled=false;});
  };
})();
</script>`
  );

  return html;
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
  html = swap(html, `src="begin-${lesson.slug}.mp3"`, `src="${escapeHtml(audioUrl)}"`);

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

export async function completionPage(course: FjCourse): Promise<string> {
  const page = course.completionPage;
  if (!page) throw new Error(`${course.title} has no completion page.`);

  let html = websitePage(await readCoursePage(course, `${page.slug}.html`), {
    title: tabTitle(page.title),
    indexable: false,
  });

  // Book 2 is not out yet, so the series page, where it shows as coming soon.
  html = swap(
    html,
    '<button class="btn gold">Continue to Book 2: Establish ›</button>',
    `<a class="btn gold" href="${SERIES_PATH}">Continue to Book 2: Establish ›</a>`
  );
  html = swap(
    html,
    '<button class="textlink" style="color:#d5dae4">Back to the course</button>',
    `<a class="textlink" style="color:#d5dae4" href="${coursePath(course)}">Back to the course</a>`
  );
  return html;
}
