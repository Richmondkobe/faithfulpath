import type { FjCourse } from "@/lib/following-jesus";
import { beforeBodyEnd } from "@/lib/fj-html";

// The page side of a learner's private answers: which boxes a page has, and
// the script that fills them and saves them. No database here, so the check in
// scripts/verify-fj-pages.mjs can build the pages without keys. The saving
// itself is lib/fj-answers.ts.

/** The names a page's boxes are saved under, in page order. */
export type PageFields = {
  texts: number;
  refs: number;
  checks: string[];
  /** Choose-one questions: the group's name and how many options it has. */
  radios: { name: string; options: number }[];
};

/**
 * Read the boxes off the page itself, so the server only accepts names the
 * page really has. The order is the files' own, and the files are final.
 */
export function pageFields(html: string): PageFields {
  return {
    texts: (html.match(/<textarea\b/g) ?? []).length,
    refs: (html.match(/<input class="ref"/g) ?? []).length,
    checks: [...html.matchAll(/<input type="checkbox" id="([a-z0-9-]+)"/g)].map((m) => m[1]),
    // My Foundations' "Look outward" (Establish): one choice of four, saved as
    // the chosen option's position, 1 to 4.
    radios: Object.entries(
      [...html.matchAll(/<input type="radio" name="([a-z0-9-]+)"/g)].reduce<Record<string, number>>((groups, m) => {
        groups[m[1]] = (groups[m[1]] ?? 0) + 1;
        return groups;
      }, {})
    ).map(([name, options]) => ({ name, options })),
  };
}

export function answersApiPath(course: FjCourse, pageSlug: string): string {
  return `/api/courses/following-jesus/${course.slug}/${pageSlug}/answers`;
}

/**
 * Fill the page's boxes with what the learner saved, and save as they type.
 *
 * The answers are written into the page as JSON for this learner only (the
 * page is private, no-store). "<" is escaped so nothing in an answer can close
 * the script tag.
 */
export function withAnswers(html: string, apiPath: string, saved: Record<string, string>): string {
  const data = JSON.stringify(saved).replace(/</g, "\\u003c");
  return beforeBodyEnd(
    html,
    `<div data-fj class="noprint fj-saved" id="fj-saved" role="status" aria-live="polite" hidden></div>
<style data-fj>
.fj-saved{position:fixed;right:16px;bottom:16px;z-index:50;background:var(--navy);color:var(--sun);border-radius:2em;padding:6px 14px;font-size:14px;box-shadow:0 4px 14px rgba(22,33,58,.25)}
.fj-saved.fj-warn{background:#8b3a2e;color:#fff}
@media print{.fj-saved{display:none!important}}
</style>
<script data-fj>
(function(){
  var API=${JSON.stringify(apiPath)},saved=${data};
  var fields=[],t=0,r=0;
  document.querySelectorAll('main textarea').forEach(function(el){fields.push(['text-'+(++t),el]);});
  document.querySelectorAll('main input.ref').forEach(function(el){fields.push(['ref-'+(++r),el]);});
  document.querySelectorAll('main input[type=checkbox][id]').forEach(function(el){fields.push([el.id,el]);});
  // A choose-one question is one answer: the chosen option's position.
  var radios={};
  document.querySelectorAll('main input[type=radio][name]').forEach(function(el){(radios[el.name]=radios[el.name]||[]).push(el);});
  Object.keys(radios).forEach(function(name){
    var group=radios[name],k='radio-'+name;
    if(Object.prototype.hasOwnProperty.call(saved,k)){var i=parseInt(saved[k],10);if(group[i-1])group[i-1].checked=true;}
  });

  // Put back what was saved. A restored tick fires the page's own change
  // handler, so the reading-plan bar and the struck-through days match.
  fields.forEach(function(f){
    var k=f[0],el=f[1];
    if(!Object.prototype.hasOwnProperty.call(saved,k))return;
    if(el.type==='checkbox'){el.checked=saved[k]==='1';el.dispatchEvent(new Event('change'));}
    else el.value=saved[k];
  });

  var note=document.getElementById('fj-saved'),pending={},timer=null,hideTimer=null;
  function show(text,warn){
    note.textContent=text;note.hidden=false;note.classList.toggle('fj-warn',!!warn);
    clearTimeout(hideTimer);if(!warn)hideTimer=setTimeout(function(){note.hidden=true;},2500);
  }
  function flush(keepalive){
    clearTimeout(timer);timer=null;
    var body=pending;pending={};
    if(!Object.keys(body).length)return;
    var json=JSON.stringify(body);
    fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:json,credentials:'same-origin',keepalive:!!keepalive&&json.length<60000})
      .then(function(res){if(!res.ok)throw new Error(res.status);show('Saved');})
      .catch(function(){
        for(var k in body)if(!Object.prototype.hasOwnProperty.call(pending,k))pending[k]=body[k];
        show('Not saved yet. Check your connection.',true);
        if(!timer)timer=setTimeout(function(){flush();},5000);
      });
  }
  function queue(k,v){pending[k]=v;show('Saving…');clearTimeout(timer);timer=setTimeout(function(){flush();},800);}

  fields.forEach(function(f){
    var k=f[0],el=f[1];
    if(el.type==='checkbox')el.addEventListener('change',function(){queue(k,el.checked?'1':'');});
    else el.addEventListener('input',function(){queue(k,el.value);});
  });
  Object.keys(radios).forEach(function(name){
    radios[name].forEach(function(el,i){el.addEventListener('change',function(){if(el.checked)queue('radio-'+name,String(i+1));});});
  });
  // Leaving the page, or switching away on a phone, saves what is waiting.
  addEventListener('pagehide',function(){flush(true);});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush(true);});
})();
</script>`
  );
}
