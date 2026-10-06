import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FjCourse } from "@/lib/following-jesus";
import type { Learner } from "@/lib/following-jesus-access";
import { beforeBodyEnd } from "@/lib/fj-html";

// What a learner writes and ticks on a course page: the lesson text boxes,
// Lesson 5's Bible references, the seven-day reading plan, and the My First
// Steps text boxes and four checkboxes.
//
// The pages promise this is private: "saved privately to your account", and
// on My First Steps, "not shared with your group or other learners". So:
//   * every read and write goes through the learner's own session, and RLS on
//     course_private_answers keeps each person to their own rows — never the
//     service-role key;
//   * nothing here logs an answer, emails it, or sends it anywhere but the
//     learner's own row;
//   * no admin page reads this table.

/** The names a page's boxes are saved under, in page order. */
export type PageFields = { texts: number; refs: number; checks: string[] };

/**
 * Read the boxes off the page itself, so the server only accepts names the
 * page really has. The order is the files' own, and the files are final.
 */
export function pageFields(html: string): PageFields {
  return {
    texts: (html.match(/<textarea\b/g) ?? []).length,
    refs: (html.match(/<input class="ref"/g) ?? []).length,
    checks: [...html.matchAll(/<input type="checkbox" id="([a-z0-9-]+)"/g)].map((m) => m[1]),
  };
}

function allowedKeys(fields: PageFields): Map<string, "text" | "check"> {
  const keys = new Map<string, "text" | "check">();
  for (let i = 1; i <= fields.texts; i++) keys.set(`text-${i}`, "text");
  for (let i = 1; i <= fields.refs; i++) keys.set(`ref-${i}`, "text");
  for (const id of fields.checks) keys.set(id, "check");
  return keys;
}

export async function getAnswers(course: FjCourse, pageSlug: string): Promise<Record<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_private_answers")
    .select("field_key, value")
    .eq("course_slug", course.key)
    .eq("page_slug", pageSlug);
  if (error) throw new Error(`Could not load answers: ${error.code}`);
  return Object.fromEntries((data ?? []).map((r) => [r.field_key, r.value]));
}

const MAX_VALUE = 20000;

/**
 * Save some of a page's answers. Unknown names, or values of the wrong kind,
 * refuse the whole save rather than storing part of it. A box cleared to
 * nothing, or a box unticked, removes the row: an empty answer is not kept.
 */
export async function saveAnswers(
  learner: Learner,
  course: FjCourse,
  pageSlug: string,
  fields: PageFields,
  changes: unknown
): Promise<"saved" | "invalid"> {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return "invalid";
  const entries = Object.entries(changes as Record<string, unknown>);
  const keys = allowedKeys(fields);
  if (entries.length === 0 || entries.length > keys.size) return "invalid";

  const keep: { key: string; value: string }[] = [];
  const clear: string[] = [];
  for (const [key, value] of entries) {
    const kind = keys.get(key);
    if (!kind || typeof value !== "string" || value.length > MAX_VALUE) return "invalid";
    if (kind === "check" && value !== "1" && value !== "") return "invalid";
    if (value.trim() === "") clear.push(key);
    else keep.push({ key, value });
  }

  const supabase = await createSupabaseServerClient();
  if (keep.length) {
    const { error } = await supabase.from("course_private_answers").upsert(
      keep.map(({ key, value }) => ({
        user_id: learner.userId,
        course_slug: course.key,
        page_slug: pageSlug,
        field_key: key,
        value,
      })),
      { onConflict: "user_id,course_slug,page_slug,field_key" }
    );
    // The code, never the message: a message can quote the row.
    if (error) throw new Error(`Could not save answers: ${error.code}`);
  }
  if (clear.length) {
    const { error } = await supabase
      .from("course_private_answers")
      .delete()
      .eq("course_slug", course.key)
      .eq("page_slug", pageSlug)
      .in("field_key", clear);
    if (error) throw new Error(`Could not clear answers: ${error.code}`);
  }
  return "saved";
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
    `<div class="noprint fj-saved" id="fj-saved" role="status" aria-live="polite" hidden></div>
<style>
.fj-saved{position:fixed;right:16px;bottom:16px;z-index:50;background:var(--navy);color:var(--sun);border-radius:2em;padding:6px 14px;font-size:14px;box-shadow:0 4px 14px rgba(22,33,58,.25)}
.fj-saved.fj-warn{background:#8b3a2e;color:#fff}
@media print{.fj-saved{display:none!important}}
</style>
<script>
(function(){
  var API=${JSON.stringify(apiPath)},saved=${data};
  var fields=[],t=0,r=0;
  document.querySelectorAll('main textarea').forEach(function(el){fields.push(['text-'+(++t),el]);});
  document.querySelectorAll('main input.ref').forEach(function(el){fields.push(['ref-'+(++r),el]);});
  document.querySelectorAll('main input[type=checkbox][id]').forEach(function(el){fields.push([el.id,el]);});

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
  // Leaving the page, or switching away on a phone, saves what is waiting.
  addEventListener('pagehide',function(){flush(true);});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush(true);});
})();
</script>`
  );
}
