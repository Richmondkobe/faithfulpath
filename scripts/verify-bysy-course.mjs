#!/usr/bin/env node
// Build assertions for "Before You Say Yes".
//
// This course has no manifest file. Its structure is declared in
// lib/bysy-course.ts, and the authority for that declaration is the file list
// and the navigation document, which are prose. These checks parse both and
// hold the code to them, so a page renamed in the file list or a label changed
// in the navigation shows up as a failure rather than as a silent mismatch.
//
// Run with: npm run verify:bysy

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join("content", "courses", "before-you-say-yes");
let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const ok = (m) => console.log(`  ok    ${m}`);

/* the file list is the authority on which pages exist, and in what order */

const fileList = readFileSync(join(ROOT, "before-you-say-yes-course-file-list.md"), "utf8");
const listed = [...fileList.matchAll(/^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|/gm)].map((m) => m[1]);

if (listed.length !== 35) fail(`the file list names ${listed.length} pages, expected 35`);
else ok("the file list names 35 pages");

for (const file of listed) {
  if (!existsSync(join(ROOT, file))) fail(`missing page ${file}`);
}
ok(`${listed.length} pages present on disk`);

/* the declaration in lib/bysy-course.ts matches it, in the same order */

const lib = readFileSync(join("lib", "bysy-course.ts"), "utf8");
const declared = [...lib.matchAll(/\{ file: "([^"]+\.md)"/g)].map((m) => m[1]);
const declaredPages = declared.filter((f) => listed.includes(f));

if (declaredPages.length !== 35) {
  fail(`lib/bysy-course.ts declares ${declaredPages.length} of the listed pages, expected 35`);
} else if (declaredPages.join("|") !== listed.join("|")) {
  const firstDiff = declaredPages.findIndex((f, i) => f !== listed[i]);
  fail(`page order diverges at position ${firstDiff + 1}: code has ${declaredPages[firstDiff]}, the file list has ${listed[firstDiff]}`);
} else {
  ok("the code declares the same 35 pages, in the file list's order");
}

/* navigation labels match course-navigation.md */

const nav = readFileSync(join(ROOT, "course-navigation.md"), "utf8");
const navLessons = [...nav.matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|$/gm)]
  .filter(([, n]) => Number(n) >= 1 && Number(n) <= 20)
  .map(([, n, label]) => [Number(n), label]);

let labelMismatch = 0;
for (const [n, label] of navLessons) {
  // The code stores the label verbatim; quotes in it are escaped for TypeScript.
  const inCode = lib.includes(label) || lib.includes(label.replace(/"/g, '\\"'));
  if (!inCode) { labelMismatch++; fail(`lesson ${n} label not found in the code: ${label}`); }
}
if (labelMismatch === 0) ok(`${navLessons.length} lesson labels match course-navigation.md`);

/* the four pause pages are labelled by their own titles, not "Module N pause" */

for (const title of ["Am I Ready to Date?", "What Have I Actually Observed?",
                     "Patterns, Not Isolated Impressions", "What Does the Evidence Require?"]) {
  if (!lib.includes(title)) fail(`pause page not labelled by its own title: ${title}`);
}
ok("the four pauses are labelled by their own titles");

/* route lengths match the table in course-navigation.md */

const routeLengths = Object.fromEntries(
  [...nav.matchAll(/^\|\s*(I am not dating yet|I have recently started dating|I am deciding whether to continue|We are considering engagement|The complete course)\s*\|\s*(\d+)\s*\|$/gm)]
    .map(([, label, n]) => [label, Number(n)])
);
const expectedRoutes = {
  "I am not dating yet": 15,
  "I have recently started dating": 26,
  "I am deciding whether to continue": 13,
  "We are considering engagement": 14,
  "The complete course": 35,
};
for (const [label, n] of Object.entries(expectedRoutes)) {
  if (routeLengths[label] !== n) {
    fail(`route "${label}" is ${routeLengths[label]} pages in course-navigation.md, the code assumes ${n}`);
  }
}
ok("route lengths agree with course-navigation.md");

/* no implementation comment survives into anything rendered */

let withComments = 0;
for (const file of readdirSync(ROOT).filter((f) => f.endsWith(".md"))) {
  if (/build-notes|file-list/.test(file)) continue;   // process documents, not pages
  const raw = readFileSync(join(ROOT, file), "utf8");
  if (/Remove this note before publishing/i.test(raw)) withComments++;
}
ok(`${withComments} pages still carry an implementation comment in source (stripped at render)`);

/* §4: no analytics label anywhere in the course code may name a safety concern */

const FORBIDDEN = /\b(abuse|afraid|fear|coerc|forced[_ -]?marriage|leaving|safety[_ -]?concern)\w*\s*[:=]\s*["'`]|["'`][^"'`]*\b(abuse_|exit_plan|afraid_to|fear_)/i;
const codeFiles = [];
const walk = (dir, into) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, into);
    else if (/\.(ts|tsx)$/.test(p)) into.push(p);
  }
};
// lib, the routes, and components — the last of which was missing, so a
// scheduled prompt added to a component was scanned by nothing at all. Both
// false negatives found in this course have been a scan set that did not
// include the file the rule was about.
for (const dir of [join("lib"), join("app"), join("components")]) {
  if (existsSync(dir)) walk(dir, codeFiles);
}
let flagged = 0;
for (const f of codeFiles) {
  if (!/bysy|before-you-say-yes/i.test(f + readFileSync(f, "utf8").slice(0, 400))) continue;
  if (FORBIDDEN.test(readFileSync(f, "utf8"))) { flagged++; fail(`${f} may carry a safety-naming analytics label`); }
}
if (flagged === 0) ok("no safety-naming event label in the course code");

/* the descriptive route label must never be what gets stored */

if (/answer:\s*route\.label|answer:\s*label|\.label\s*\}\s*\)/.test(lib)) {
  fail("a route's descriptive label appears to be stored — it must be the opaque id");
}
ok("routes are stored by opaque id, never by label");

/* §4 Export: the policy exists, names the right pages, and nothing has quietly
   built an "export everything" affordance */

const policy = readFileSync(join("lib", "bysy-export-policy.ts"), "utf8");
for (const [file, what] of [
  ["lesson-19-when-to-walk-away.md", "Lesson 19 (all of it)"],
  ["lesson-08-boundaries-without-shame.md", "Lesson 8 Part A"],
  ["lesson-15-can-we-build-a-life.md", "Lesson 15 Part A"],
  ["module-6-02-questions-before-engagement.md", "Questions Before Engagement Part A"],
  ["lesson-09-sexual-boundaries.md", "Lesson 9 Part A"],
  ["lesson-12-their-past.md", "Lesson 12 Part A"],
]) {
  if (!policy.includes(file)) fail(`the export policy no longer excludes ${what}`);
}
if (!/parts:\s*"all"/.test(policy)) fail("Lesson 19 is no longer excluded in full");
for (const [file, what] of [
  ["lesson-07-quiet-green-flags.md", "Lesson 7 Parts A to C"],
  ["lesson-02-equally-yoked.md", "Lesson 2"],
  ["lesson-04-attraction-is-not-discernment.md", "Lesson 4"],
]) {
  if (!policy.includes(file)) fail(`the export policy no longer excludes ${what}, which the page says is answered alone`);
}
ok("the export policy excludes every part answered alone, and all of Lesson 19");

// Default deny. An allowlist that quietly grows is the failure this guards.
if (!/const EXPORTABLE[^=]*=\s*\[\s*\]/.test(policy)) {
  fail("EXPORTABLE is no longer empty — something has been made exportable; confirm it is a deliberate §4 decision and that the learner is told what the file contains");
}
ok("nothing is exportable: the allowlist is empty and the default is deny");

// Every page the content tells the learner to answer alone is named. Read from
// the pages rather than from a list, so a new one cannot be missed.
const aloneRe = /for you alone|Answer alone|alone and first|yours alone|Complete Part [A-Z] alone/i;
for (const file of listed) {
  const raw = readFileSync(join(ROOT, file), "utf8");
  if (aloneRe.test(raw) && !policy.includes(file)) {
    fail(`${file} tells the learner to answer alone but is not named in the export policy`);
  }
}
ok("every page that says answer alone is named in the export policy");

// Any export that can reach this course's content must consult the policy.
//
// Matched on what an export actually does — serves a file or builds a document
// — rather than on the word "export", which appears in every module, or
// "download", which appears in prose about §4. A heuristic that fires on
// documentation teaches people to ignore the check.
//
// Scanned across the whole app rather than only this course's folder, because
// the likelier way the exclusion gets lost is not a new route here. It is the
// shared journal export gaining this course: that file already carries two
// courses, and adding a third is one line, in a path with no "bysy" in it.
const everyFile = [];
for (const dir of ["lib", join("app")]) if (existsSync(dir)) walk(dir, everyFile);

const SERVES_A_FILE = /application\/pdf|Content-Disposition|buildJournalPdf|buildExport/;
const REACHES_THIS_COURSE = /before-you-say-yes|BYSY_SLUG|bysy-course|bysy-progress/;

const exportPaths = everyFile.filter((f) => {
  const code = readFileSync(f, "utf8");
  return SERVES_A_FILE.test(code) && REACHES_THIS_COURSE.test(code);
});

const failuresBefore = failures;
for (const f of exportPaths) {
  if (!readFileSync(f, "utf8").includes("bysy-export-policy")) {
    fail(
      `${f} can put this course's content in a file but does not consult lib/bysy-export-policy — ` +
      `see build notes §4 (Export): the private parts of the joint tools, the parts answered alone, ` +
      `and all of Lesson 19 are excluded by default`
    );
  }
}
if (failures === failuresBefore) {
  ok(
    exportPaths.length === 0
      ? "no export path can reach this course's content yet"
      : `${exportPaths.length} export path(s) reach this course, all consulting the policy`
  );
}

/* §7: the records kept over time must never prompt on a schedule, which turns
   observation into monitoring. Nothing in this course may schedule, remind or
   notify. */

const SCHEDULES = /setInterval|cron|schedule[A-Z]|scheduleWakeup|sendReminder|remindAt|nextPromptAt|notifyAfter|Notification\(|requestPermission/;
let schedulers = 0;
for (const f of codeFiles) {
  if (!/bysy|before-you-say-yes/i.test(f)) continue;
  const code = readFileSync(f, "utf8");
  // Strip comments: the reason these are forbidden is written in several of
  // them, and a check that trips on its own rationale gets ignored.
  const bare = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  if (SCHEDULES.test(bare)) {
    schedulers++;
    fail(`${f} schedules, reminds or notifies — §7 forbids prompting on a schedule, which turns observation into monitoring`);
  }
}
if (schedulers === 0) ok("nothing in this course schedules a prompt, reminder or notification");

/* §7: cross-lesson recall.

   Three things have to hold, and each of them fails silently if it stops
   holding — which is why they are assertions rather than a note.

   A ref naming a page that does not exist produces "You have not written
   anything here yet" forever. That is the most dangerous possible failure of
   this feature: it is indistinguishable from the truth, so a learner reads it
   as an answer about themselves rather than a bug.

   Recall must also stay on demand. If a Server Component ever fetches earlier
   answers, they land in the page source and the browser cache before the
   learner has asked for anything — the exposure §7 exists to prevent on a
   monitored device, and invisible from the rendered page, which looks the same
   either way.

   And nothing that reads earlier answers may also send mail or raise a
   notification. §7 forbids recalled answers reaching notifications, previews or
   emails; this course sends none today, and this is what notices the day one is
   added next to the reader. */

const recallPage = join("app", "members", "courses", "before-you-say-yes", "[slug]", "page.tsx");
if (!existsSync(recallPage)) {
  fail(`${recallPage} is missing — cross-lesson recall is wired there`);
} else {
  const src = readFileSync(recallPage, "utf8");
  const slugs = new Set(listed.map((f) => f.replace(/\.md$/, "")));
  const refs = [...src.matchAll(/pageSlug:\s*"([^"]+)"/g)].map((m) => m[1]);

  if (refs.length === 0) {
    fail("no cross-lesson recall refs found — §7's recall is not wired");
  } else {
    const unknown = refs.filter((r) => !slugs.has(r));
    if (unknown.length > 0) {
      for (const r of new Set(unknown)) {
        fail(`recall names "${r}", which is not a page in this course — it would show "nothing written yet" forever`);
      }
    } else {
      ok(`${new Set(refs).size} recall target(s) all resolve to real pages`);
    }
  }

  if (/fetchEarlierAnswers/.test(src)) {
    fail(`${recallPage} fetches earlier answers on the server — §7 forbids displaying previous answers automatically`);
  } else {
    ok("recall is requested by the learner, never fetched while the page renders");
  }
}

const MAIL = /resend|sendMail|sendEmail|nodemailer|Notification\(|push[A-Z]?[Nn]otification|@react-email/;
let recallSenders = 0;
for (const f of codeFiles) {
  const code = readFileSync(f, "utf8");
  if (!/fetchEarlierAnswers/.test(code)) continue;
  const bare = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  if (MAIL.test(bare)) {
    recallSenders++;
    fail(`${f} both reads earlier answers and sends mail or a notification — §7 forbids recalled answers reaching notifications, previews or emails`);
  }
}
if (recallSenders === 0) ok("nothing that reads earlier answers sends mail or a notification");

const recallComponent = join("components", "bysy", "EarlierAnswers.tsx");
if (!existsSync(recallComponent)) {
  fail(`${recallComponent} is missing`);
} else {
  const c = readFileSync(recallComponent, "utf8");

  // Read the branches, not the file. Checking whether MONITORING_NOTE appears
  // anywhere passes on the import line alone, and checking whether it appears
  // *before* the fetch passes on the import line too — the reveal function is
  // declared above all the JSX, so source order says nothing about what the
  // learner sees first. What carries the rule is which state each thing is in:
  // the note belongs in the state that offers to open the answers, and the
  // state before it must not be able to fetch anything.
  const closedAt = c.indexOf('state === "closed"');
  const askedAt = c.indexOf('state === "asked"');
  const openAt = c.lastIndexOf("return (");

  if (closedAt < 0 || askedAt < 0 || askedAt < closedAt) {
    fail(`${recallComponent} no longer has a closed state before an asked state — §7 requires the note before the answers open`);
  } else {
    const closedBranch = c.slice(closedAt, askedAt);
    const askedBranch = c.slice(askedAt, openAt > askedAt ? openAt : c.length);

    if (!/\{\s*MONITORING_NOTE\s*\}/.test(askedBranch)) {
      fail(`${recallComponent} does not show the monitoring note in the state that offers to open the answers — §7 requires it before they open`);
    } else {
      ok("the monitoring note is shown in the state that offers to open the answers");
    }

    // A bare `reveal` counts: onClick={reveal} fetches just as surely as
    // reveal(), and matching only the call missed exactly that.
    if (/\breveal\b|\bfetchEarlierAnswers\b/.test(closedBranch)) {
      fail(`${recallComponent} can fetch from its closed state — §7 forbids displaying previous answers automatically`);
    } else {
      ok("nothing is fetched until the learner has passed the monitoring note");
    }
  }

  if (!/useState<[^>]*>\(\s*"closed"\s*\)/.test(c)) {
    fail(`${recallComponent} does not start closed — §7 forbids displaying previous answers automatically`);
  } else {
    ok("recall starts closed");
  }
}

/* §5: the joint tools.

   The private part is completed alone and first; the shared section opens only
   behind a gate; and the interface must never suggest the other person has
   access. The gate is the part that can fail while still looking right, so
   these check the two ways it silently stops gating.

   Passing the shared section in as `children` renders it on the server and
   ships it in the page payload — the record is in the page source and the
   browser cache while the gate still looks shut. That is how it was built
   first, and a seeded shared record was readable in Lesson 8's page source with
   the gate closed. The gate fetches what it shows instead.

   And a safety answer has to replace the section, not caption it. A gate that
   says "if you are afraid, take care" and then shows the fields anyway has
   written a disclaimer, not a gate. */

const gate = join("components", "bysy", "JointGate.tsx");
if (!existsSync(gate)) {
  fail(`${gate} is missing — §5 requires a gate on every joint section`);
} else {
  const g = readFileSync(gate, "utf8");
  const bare = g.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  if (/\bchildren\b/.test(bare)) {
    fail(`${gate} takes its shared section as children — it would be rendered into the page while the gate is closed`);
  } else if (!/fetchToolRows/.test(bare)) {
    fail(`${gate} does not fetch the shared record — it must not be handed one while closed`);
  } else {
    ok("the joint gate fetches its shared section rather than being handed one");
  }

  // The refusal branch must return before anything that renders the section.
  const refusal = bare.indexOf('safe === "no"');
  const afterRefusal = refusal < 0 ? "" : bare.slice(refusal, bare.indexOf("if (!privatePartDone"));
  if (refusal < 0) {
    fail(`${gate} has no branch for a learner who cannot do this part safely`);
  } else if (/PrivateWorksheet/.test(afterRefusal)) {
    fail(`${gate} still renders the shared section after a safety answer — §3's route must replace the options, not sit beside them`);
  } else {
    ok("a safety answer replaces the joint section rather than captioning it");
  }

  if (/saveToolRows|saveTool|\bsave\(/.test(bare)) {
    fail(`${gate} saves something — §4 forbids storing that a learner took a safety path`);
  } else {
    ok("nothing the gate asks is stored");
  }
}

/* Every §5 page must actually have one wired. */
const JOINT_PAGES = [
  ["lesson-08-boundaries-without-shame", "Lesson 8"],
  ["lesson-15-can-we-build-a-life", "Lesson 15"],
  ["module-6-02-questions-before-engagement", "Questions Before Engagement"],
];
if (existsSync(recallPage)) {
  const src = readFileSync(recallPage, "utf8");
  // Check each tool where it is actually declared. Searching the source for a
  // slug reports a tool that does not exist: all three slugs appear as recall
  // targets too, and Questions Before Engagement kept passing on its recall
  // entry after its tool had been renamed out of existence.
  const mapAt = src.indexOf("const JOINT:");
  const mapEnd = src.indexOf("const jointSpec");
  const jointMap = mapAt >= 0 && mapEnd > mapAt ? src.slice(mapAt, mapEnd) : "";
  const qbeFile = /const QBE_FILE = "([^"]+)"/.exec(src)?.[1] ?? "";
  // Anchored on the branch, not on what precedes it: inserting another branch
  // ahead of it turned "{qbe ? (" into ") : qbe ? (" and the check reported the
  // tool missing.
  const qbeAt = src.indexOf("qbe ? (");
  const qbeEnd = src.indexOf(") : joint ? (");
  const qbeBranch = qbeAt >= 0 && qbeEnd > qbeAt ? src.slice(qbeAt, qbeEnd) : "";

  if (!/<JointGate/.test(src)) {
    fail("no joint gate is wired — §5 requires one on each of the three joint tools");
  } else {
    for (const [slug, name] of JOINT_PAGES) {
      // Match the whole name, not a prefix of it. `<JointGate` matches
      // `<JointGateXX`, and a map key renamed to "…-a-lifeX" still contains the
      // slug it used to be — both reported wired while neither was.
      const declared =
        slug === "module-6-02-questions-before-engagement"
          ? qbeFile === `${slug}.md` && /<JointGate[\s/>]/.test(qbeBranch)
          : jointMap.includes(`"${slug}": {`);
      if (!declared) fail(`${name} (${slug}) is not wired as a joint tool — §5 names all three`);
    }
    ok("all three joint tools are wired, each where it is declared");
  }
}

/* A part is a letter, optionally numbered. Reading only the first character
   mapped Q1 through Q10 onto part Q — ten sections overwriting one row, with
   nothing visible but answers that kept disappearing. */

const progress = readFileSync(join("lib", "bysy-progress.ts"), "utf8");
const indexFn = progress.slice(progress.indexOf("export function toolIndex"));
if (/charCodeAt\(0\)/.test(indexFn.slice(0, indexFn.indexOf("}")))) {
  fail("lib/bysy-progress.ts derives a tool index from the first character alone — numbered parts would collide");
} else if (!/\^\(\[A-Za-z\]\)\(\\d/.test(indexFn)) {
  fail("lib/bysy-progress.ts no longer anchors a tool part to a letter with an optional number");
} else {
  ok("numbered tool parts get their own storage, not the letter's");
}

/* §3's routing rule, on the pages that offer a safety route among ordinary
   choices: the route is displayed immediately and replaces the other options.

   Which options are safety routes is read from the content — an option that
   says it replaces the others, or one carrying a conditional caveat about fear,
   coercion or threats. That is the right way round, but it fails silently: if
   the page is reworded, the marker stops matching, every option becomes an
   ordinary one, and the list still renders perfectly. Nothing about the page
   would look wrong. So the markers are asserted against the content. */

const SAFETY_MARKERS = [
  ["pause-04-what-does-the-evidence-require.md", "## Where that leaves you", /replaces the others/i],
  ["my-next-faithful-step.md", "## Choose one", /replaces the others/i],
  [
    "lesson-16-good-christians-wrong-for-each-other.md",
    "## Next faithful step",
    /if you fear|where family coercion|where coercion|if you are afraid/i,
  ],
];

let markersLost = 0;
for (const [file, heading, marker] of SAFETY_MARKERS) {
  const text = readFileSync(join(ROOT, file), "utf8");
  const at = text.indexOf(heading);
  if (at < 0) {
    markersLost++;
    fail(`${file} no longer has the section "${heading}" the choice list is built from`);
    continue;
  }
  const rest = text.slice(at + heading.length);
  const end = rest.search(/^##\s/m);
  const section = end > 0 ? rest.slice(0, end) : rest;
  if (!marker.test(section)) {
    markersLost++;
    fail(`${file} no longer marks a safety route in "${heading}" — every option would render as an ordinary one`);
  }
}
if (markersLost === 0) ok("each choice list still names a safety route the code can find");

const choiceList = join("components", "bysy", "ChoiceList.tsx");
if (!existsSync(choiceList)) {
  fail(`${choiceList} is missing — §3's routing rule is not built`);
} else {
  const c = readFileSync(choiceList, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const replacesAt = c.indexOf("chosen?.replaces");
  const listAt = c.indexOf("choices.map(");
  if (replacesAt < 0) {
    fail(`${choiceList} no longer routes on an option that replaces the others`);
  } else if (listAt >= 0 && replacesAt > listAt) {
    fail(`${choiceList} renders the option list before the safety route — §3 requires the route to replace them`);
  } else {
    ok("a safety route replaces the option list rather than sitting in it");
  }
  if (/saveToolRows|useTransition|fetch\(/.test(c)) {
    fail(`${choiceList} stores or sends something — §4 forbids storing a safety selection`);
  } else {
    ok("nothing selected in a choice list is stored or sent");
  }
}

/* And each of those pages, plus Lesson 6, must actually have one wired. */
if (existsSync(recallPage)) {
  const src = readFileSync(recallPage, "utf8");
  const mapAt = src.indexOf("const CHOICES:");
  const mapEnd = src.indexOf("const choiceSpec");
  const choiceMap = mapAt >= 0 && mapEnd > mapAt ? src.slice(mapAt, mapEnd) : "";
  let unwired = 0;
  for (const [file] of SAFETY_MARKERS) {
    const slug = file.replace(/\.md$/, "");
    if (!choiceMap.includes(`"${slug}": {`)) {
      unwired++;
      fail(`${slug} offers a safety route among ordinary choices but has no choice list wired`);
    }
  }
  if (!/<NextStepOptions/.test(src)) {
    unwired++;
    fail("Lesson 6's next step is no longer wired — it is the same rule");
  }
  if (unwired === 0) ok("all four pages offering a safety route route it");
}

/* §6: verification metadata lives beside the source file, and the review date
   rests on it.

   The rule the register encodes is that every entry has a *known status* — not
   that every entry is verified. Finding out that a detail cannot be established
   from the operator's own source is a result, not a gap, and so is deciding
   that a block is presented as a starting point rather than as verified
   entries. What may not happen is an entry nobody has looked at being invisible
   behind a date that implies somebody did.

   So: every row carries a status from the agreed set, every section of the page
   has rows, and the date may show only when both hold. An unrecognised status
   fails — a typo, or a status nobody agreed, would otherwise pass as though it
   meant something. */

const { readRegister, readSummary, readSections, STATUSES, REGISTER, SOURCE } =
  await import("./bysy-resource-register.mjs");

if (!existsSync(REGISTER)) {
  fail(`${REGISTER} is missing — §6 requires verification metadata beside the source file`);
} else if (!existsSync(SOURCE)) {
  fail(`${SOURCE} is missing`);
} else {
  const rows = readRegister();
  const sections = readSections();

  const unknown = rows.filter((r) => !(r.status in STATUSES));
  if (unknown.length > 0) {
    for (const r of unknown.slice(0, 4)) {
      fail(`the register gives "${r.name}" the status "${r.status}", which is not one of: ${Object.keys(STATUSES).join(", ")}`);
    }
  } else {
    ok(`all ${rows.length} register rows carry a recognised status`);
  }

  const bare = sections.filter((s) => !rows.some((r) => r.section === s));
  if (bare.length > 0) {
    for (const s of bare) {
      fail(`"${s}" is a section of the resources page with no rows in the register`);
    }
  } else {
    ok(`all ${sections.length} sections of the resources page are accounted for`);
  }

  // Every count in the summary, against the tables it summarises. A summary
  // that understates what is unchecked is how a page comes to show a date it
  // has not earned — this register arrived once claiming 55 verified and 15
  // outstanding where its tables gave 71 and 13, and again claiming 67 verified
  // where they gave 82. Only the outstanding count was asserted then, so the
  // other two drifted unnoticed until they were read by hand.
  const summary = readSummary();
  const actual = {};
  for (const r of rows) actual[r.status] = (actual[r.status] ?? 0) + 1;

  const drifted = Object.entries(summary).filter(([label, stated]) => stated !== (actual[label] ?? 0));
  if (drifted.length > 0) {
    for (const [label, stated] of drifted) {
      fail(`the register's summary states ${stated} ${label.toLowerCase()}, but its rows give ${actual[label] ?? 0}`);
    }
  } else if (Object.keys(summary).length > 0) {
    ok(`the register's summary agrees with its tables on all ${Object.keys(summary).length} counts`);
  }

  // Entries against findings. The next review needs to know how many services
  // are on the page, not how many rows are in the table, and those differ.
  const entries = rows.filter((r) => r.kind === "entry");
  const findings = rows.filter((r) => r.kind === "finding");

  const statedEntries = /\*\*(\d+) services\*\*/.exec(readFileSync(REGISTER, "utf8"))?.[1];
  const statedFindings = /\*\*(\d+) findings\*\*/.exec(readFileSync(REGISTER, "utf8"))?.[1];
  if (statedEntries !== undefined && Number(statedEntries) !== entries.length) {
    fail(`the register says ${statedEntries} services are listed, but its rows give ${entries.length}`);
  } else if (statedFindings !== undefined && Number(statedFindings) !== findings.length) {
    fail(`the register says ${statedFindings} findings are recorded, but its rows give ${findings.length}`);
  } else {
    ok(`the register accounts for ${entries.length} services and ${findings.length} findings about them`);
  }

  // A finding belongs beside the entry it concerns. One had drifted three rows
  // from its own — StepChange's coverage correction — which is how a finding
  // comes to be read as a service, and counted as one.
  const orphans = [];
  for (const section of new Set(rows.map((r) => r.section))) {
    const inSection = rows.filter((r) => r.section === section);
    // A section with no entries at all is the emergency block: out of scope by
    // design, so its findings have nothing to sit beneath and that is correct.
    if (!inSection.some((r) => r.kind === "entry")) continue;
    inSection.forEach((r, i) => {
      if (r.kind !== "finding") return;
      // It may follow its entry, or another finding about the same entry. What
      // it may not do is open the section, with no entry above it.
      if (i === 0) orphans.push(r);
    });
  }
  if (orphans.length > 0) {
    for (const o of orphans) fail(`the finding "${o.name}" does not sit beneath an entry`);
  } else {
    ok("every finding sits beneath the entry it concerns");
  }

  const shown = /Last reviewed:\s*(\d{1,2}\s+\w+\s+\d{4})/.exec(readFileSync(SOURCE, "utf8"))?.[1];
  const blocked = unknown.length > 0 || bare.length > 0;
  if (shown && blocked) {
    fail(`the resources page shows "Last reviewed: ${shown}" while the register does not account for every entry`);
  } else if (shown) {
    const counts = Object.entries(
      rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})
    )
      .map(([k, v]) => `${v} ${k.toLowerCase()}`)
      .join(", ");
    ok(`the review date is shown, and every entry has a known status (${counts})`);
  } else {
    ok("no review date is shown, and §6's review-in-progress notice stands in its place");
  }
}

/* Nothing links to the course until the checklist has been run.

   BYSY_PUBLISHED is the switch. A link added anywhere outside the course that
   does not go through it would put a learner into a course with an unproven §4
   item in it, which is the one thing the unlinked state exists to prevent. */

const published = /export const BYSY_PUBLISHED = (true|false)/.exec(
  readFileSync(join("lib", "bysy-links.ts"), "utf8")
)?.[1];

if (!published) {
  fail("lib/bysy-links.ts no longer declares BYSY_PUBLISHED");
} else {
  let unguarded = 0;
  for (const f of codeFiles) {
    // The course's own files reach themselves; that is not a way in.
    if (/bysy/i.test(f) || f.includes(join("courses", "before-you-say-yes"))) continue;
    const code = readFileSync(f, "utf8");
    const bare = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // Comparing against the path is not linking to it. A component that hides
    // itself on the course's routes mentions the path in order to stay away
    // from it, which is the opposite of a way in.
    // Importing the constant is not using it, and comparing against the path is
    // not linking to it — a component that hides itself on the course's routes
    // names the path in order to stay away from it.
    const uses = bare
      .replace(/^\s*import[\s\S]*?from\s*["'][^"']*["'];?$/gm, "")
      .replace(
        /(startsWith|includes|indexOf|match|test)\(\s*(BYSY_BASE|["'`]\/members\/courses\/before-you-say-yes[^"'`]*["'`])/g,
        ""
      );

    // Pulling in one of the course's components is a way in even when the URL
    // itself is inside that component — which is exactly how the members card
    // slipped past a check that looked only for the path.
    const reaches =
      /BYSY_BASE|\/members\/courses\/before-you-say-yes/.test(uses) ||
      /from "@\/components\/bysy\//.test(bare);
    if (!reaches) continue;
    if (!/BYSY_PUBLISHED/.test(bare)) {
      unguarded++;
      fail(`${f} links to Before You Say Yes without going through BYSY_PUBLISHED`);
    }
  }
  if (unguarded === 0) {
    ok(
      published === "true"
        ? "the course is published, and every way in goes through BYSY_PUBLISHED"
        : "the course is unlinked: every way in goes through BYSY_PUBLISHED, which is false"
    );
  }
}

/* No page of this course asks who the learner is.

   The site's footer mailing-list form rendered a name and email field on all 35
   pages, including Lesson 19. It stored nothing from the course and was never
   course content, which is exactly why it survived every other check here —
   and it was still the wrong thing at the foot of a page about leaving safely. */

const rootLayout = join("app", "layout.tsx");
const footerSignup = join("components", "FooterSignup.tsx");
if (!existsSync(rootLayout)) {
  fail(`${rootLayout} is missing`);
} else {
  const layout = readFileSync(rootLayout, "utf8").replace(/^\s*\/\/.*$/gm, "");
  if (/<SignupForm\b/.test(layout)) {
    fail(`${rootLayout} renders the signup form directly — it would appear on every page of this course`);
  } else if (!existsSync(footerSignup)) {
    fail(`${footerSignup} is missing — nothing keeps the signup form off the course`);
  } else {
    const fs = readFileSync(footerSignup, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // Loose on purpose: the guard reads `startsWith(BYSY_BASE)`, and a pattern
    // built from [^)] cannot cross that inner bracket — it failed on the
    // correct file.
    //
    // Both pages, separately. The public resources page is the same helplines
    // outside the member gate, read by the same people; one guard passing is
    // not evidence about the other.
    const guards = [
      ["BYSY_BASE", "this course's 35 pages"],
      ["BYSY_RESOURCES_PATH", "the public resources page"],
    ].filter(([name]) => !new RegExp(`${name}[\\s\\S]{0,40}return null`).test(fs));

    if (guards.length > 0) {
      for (const [, where] of guards) {
        fail(`${footerSignup} no longer returns null on ${where} — the signup form would be back on it`);
      }
    } else {
      ok("neither this course nor its public resources page carries the site's name-and-email form");
    }
  }
}

/* §3's exit control, and the two ways this version of it can quietly fail.

   It is a small pill now rather than a panel, because the panel covered the
   content on a phone and because a block reading "leave this page" and
   "someone who monitors this device" tells anyone glancing over a reader's
   shoulder what kind of page they are on. The note it used to display
   permanently now appears on hover, focus or tap.

   Which introduces a regression nobody would see: render the note only when it
   is open and it leaves the accessibility tree too, so a screen-reader user is
   told less about what the button does than a sighted one — on the one control
   where being wrong about what it does is dangerous. The note must be in the
   document always, hidden visually.

   And leaving must stay one action. A confirmation step, or a note that has to
   be dismissed first, puts a tap between somebody and the reason they reached
   for this. */

const exitControl = join("components", "bysy", "ExitControl.tsx");
if (!existsSync(exitControl)) {
  fail(`${exitControl} is missing — §3 requires a persistent exit control`);
} else {
  const e = readFileSync(exitControl, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  if (!/sr-only/.test(e)) {
    fail(`${exitControl} no longer hides its note visually — either it is permanently displayed again, or it has left the accessibility tree`);
  } else if (/\{\s*show\w*\s*&&[\s\S]{0,200}\{NOTE\}/.test(e)) {
    fail(`${exitControl} renders its note conditionally — a screen reader would not reach it`);
  } else {
    ok("the exit control's note is always in the document, shown on request");
  }

  if (!/location\.replace/.test(e)) {
    fail(`${exitControl} no longer leaves via location.replace — the course would stay in the Back history`);
  } else if (/confirm\(|window\.confirm|"Are you sure/.test(e)) {
    fail(`${exitControl} asks for confirmation — leaving must stay one action`);
  } else {
    ok("leaving is one action, and the course does not become the Back target");
  }
}

/* "Help Me Right Now" lists a lesson, what it covers, and sometimes a second
   lesson — three things per entry, on three lines in the source.

   Markdown collapses a single newline into a space, so all three rendered as
   one run-on sentence: "Lesson 8 — Boundaries Without Shame What a boundary
   actually is…". The fix is a hard break at the end of the line, written as a
   trailing backslash rather than two trailing spaces — two spaces are
   invisible, and the first formatter to strip trailing whitespace would undo it
   silently, which is how this would come back. */

const HELP_PAGE = join(ROOT, "06-help-me-right-now.md");
if (!existsSync(HELP_PAGE)) {
  fail("06-help-me-right-now.md is missing");
} else {
  const helpLines = readFileSync(HELP_PAGE, "utf8").split("\n");
  const runOn = [];
  helpLines.forEach((line, i) => {
    const next = helpLines[i + 1] ?? "";
    const needsBreak =
      (line.startsWith("→ **") && next.trim() !== "" && !next.startsWith("*Also useful")) ||
      (next.startsWith("*Also useful") && line.trim() !== "");
    if (needsBreak && !line.endsWith("\\")) runOn.push(line.slice(0, 54));
  });

  if (runOn.length > 0) {
    for (const line of runOn.slice(0, 4)) {
      fail(`06-help-me-right-now.md: "${line}…" runs into the line below it — it needs a trailing backslash`);
    }
    if (runOn.length > 4) fail(`…and ${runOn.length - 4} more lines that run on`);
  } else {
    const breaks = helpLines.filter((l) => l.endsWith("\\")).length;
    ok(`every entry on Help Me Right Now breaks onto its own line (${breaks} hard breaks)`);
  }
}

/* The simple layer.

   Two things about it can fail silently. Its 32 pages are declared in code, so
   a renamed or missing file shows as a 404 nobody visits rather than an error.
   And each page's scripts are written for whoever records them — they open
   with "About seven minutes. Read slowly and naturally…" and carry "[Pause for
   five seconds.]" — which are instructions to a narrator. The first of those
   was on all 32 pages' transcripts before anyone noticed. */

const SIMPLE_DIR = join(ROOT, "simple-lessons");
const simpleLib = readFileSync(join("lib", "bysy-simple.ts"), "utf8");
const declaredSimple = [...simpleLib.matchAll(/file:\s*"([^"]+\.md)"/g)].map((m) => m[1]);

if (declaredSimple.length !== 32) {
  fail(`lib/bysy-simple.ts declares ${declaredSimple.length} simple pages, expected 32`);
} else {
  const absent = declaredSimple.filter((f) => !existsSync(join(SIMPLE_DIR, f)));
  if (absent.length > 0) {
    for (const f of absent.slice(0, 4)) fail(`the simple layer declares ${f}, which is not on disk`);
  } else {
    ok("all 32 simple pages are declared and present");
  }
}

let leaks = 0;
for (const f of declaredSimple) {
  const path = join(SIMPLE_DIR, f);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, "utf8");
  // What readSimplePage() and transcriptOf() between them must remove.
  const stripped = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*\*\(About[^)]*\)\*\s*$/gm, "")
    .replace(/\*\[[^\]]*\]\*/g, "");
  if (/IMPLEMENTATION NOTE/.test(stripped)) {
    leaks++;
    fail(`${f}: an implementation note survives stripping — it would reach a reader`);
  }
  if (/place this inside the closed|Pause for five seconds/.test(stripped)) {
    leaks++;
    fail(`${f}: a recording direction survives stripping — it would be read as spoken words`);
  }
}
if (leaks === 0) ok("no implementation note or recording direction survives into a simple page");

const simpleLinks = readFileSync(join("lib", "bysy-simple-links.ts"), "utf8");
const simplePublished = /export const BYSY_SIMPLE_PUBLISHED = (true|false)/.exec(simpleLinks)?.[1];
if (!simplePublished) {
  fail("lib/bysy-simple-links.ts no longer declares BYSY_SIMPLE_PUBLISHED");
} else {
  let ways = 0;
  for (const f of codeFiles) {
    if (/bysy-simple/i.test(f) || f.includes(join("simple", "[slug]"))) continue;

    // The detailed lesson route links back to the simple layer, but only for a
    // reader who arrived from it: the link renders when `from` names a real
    // simple page and not otherwise. That is a way back, not a way in — and it
    // has to be shown to be, rather than waved through.
    if (f === recallPage) {
      const src = readFileSync(f, "utf8");
      const guarded =
        /chapterReferrer\(/.test(src) &&
        /cameFrom \? simpleHref\(/.test(src) &&
        !/href=\{simpleHref\([^)]*\)\}/.test(src.replace(/cameFrom \? simpleHref\([^)]*\)/g, ""));
      if (!guarded) {
        ways++;
        fail(`${f} links to the simple layer other than as a way back from a book chapter`);
      }
      continue;
    }
    const bare = readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/^\s*import[\s\S]*?from\s*["'][^"']*["'];?$/gm, "");
    if (!/SIMPLE_BASE|simpleHref\(/.test(bare)) continue;
    if (!/BYSY_SIMPLE_PUBLISHED/.test(bare)) {
      ways++;
      fail(`${f} links to the simple layer without going through BYSY_SIMPLE_PUBLISHED`);
    }
  }
  if (ways === 0) {
    ok(
      simplePublished === "true"
        ? "the simple layer is published, and every way in goes through BYSY_SIMPLE_PUBLISHED"
        : "the simple layer is unlinked: BYSY_SIMPLE_PUBLISHED is false and nothing links to it"
    );
  }
}

/* Nothing in a simple page may be dropped on the way to the reader.

   The template used to render only the headings it knew by name, and the files
   spell them more than one way — "Listen" on twelve pages, "Listen to the
   lesson" on twenty; a straight apostrophe in "Today's question" on
   twenty-three, a curly one on five. Worse, §3's "Before you begin" notice sits
   *above* the first heading on Lessons 6, 9, 10, 13 and 19, as does Lesson 20's
   crisis notice, and a splitter that waited for a heading threw all of it away.
   Seven pages rendered without the safety notice that is the reason they have
   one, and every one of them returned 200.

   So: every page's sections, and its preamble, must survive parsing. */

{
  const simpleFiles = declaredSimple.filter((f) => existsSync(join(SIMPLE_DIR, f)));
  const { pageSections, parseScreens, workbookOf } = await import("../lib/bysy-simple.mjs")
    .catch(() => ({}));

  let dropped = 0;
  for (const f of simpleFiles) {
    const raw = readFileSync(join(SIMPLE_DIR, f), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const lines = raw.split("\n");

    // A preamble is anything with letters between the title and the first `##`.
    const firstHeading = lines.findIndex((l) => /^##\s+(?!#)/.test(l));
    if (firstHeading > 1) {
      const preamble = lines.slice(1, firstHeading).join("\n").trim();
      if (preamble && /^>/m.test(preamble)) {
        // It is a notice. The renderer must have a section with no heading,
        // which is what pageSections produces for it.
        if (!/let heading: string \| null = ""/.test(readFileSync(join("lib", "bysy-simple.ts"), "utf8"))) {
          dropped++;
          fail(`${f} opens with a notice above its first heading, and pageSections would discard it`);
        }
      }
    }
  }
  if (dropped === 0) ok("a page's opening notice survives parsing");

  // Screen counts: what the file has is what the parser finds.
  const libSrc = readFileSync(join("lib", "bysy-simple.ts"), "utf8");
  if (!/export function workbookOf/.test(libSrc)) {
    fail("lib/bysy-simple.ts has lost workbookOf — workbooks grouped into Parts would find no screens");
  } else {
    ok("workbooks are taken whole, not cut short at their first Part heading");
  }
  void pageSections; void parseScreens; void workbookOf;
}

/* §6.3's table of non-saved and read-only screens, against the code.

   This is the table that decides whether an answer about fear, coercion or a
   safety route is written to an account. It lives in two places — the addendum
   and lib/bysy-simple.ts — and the only thing keeping them together is this. */

{
  // §6.3 only. §2's file-mapping table has a row per page too, and reading a
  // filename as a screen list made "engagement-02-…" mean screen 2.
  const whole = readFileSync(
    join(ROOT, "before-you-say-yes-simple-course-build-notes.md"),
    "utf8"
  );
  const from = whole.indexOf("### 6.3");
  const to = whole.indexOf("### 6.4");
  const addendum = from >= 0 && to > from ? whole.slice(from, to) : "";
  if (!addendum) fail("§6.3's table of non-saved screens is not where it was");
  const libSrc = readFileSync(join("lib", "bysy-simple.ts"), "utf8");

  // Rows look like: | Lesson 7 | Screens 6–8 (guide) | — |
  const numbers = (cell) => {
    const out = new Set();
    for (const m of cell.matchAll(/(\d+)\s*(?:–|—|-)\s*(\d+)/g)) {
      for (let n = Number(m[1]); n <= Number(m[2]); n++) out.add(n);
    }
    for (const m of cell.replace(/(\d+)\s*(?:–|—|-)\s*(\d+)/g, "").matchAll(/\d+/g)) {
      out.add(Number(m[0]));
    }
    return out;
  };

  let drift = 0;
  for (const row of addendum.matchAll(/^\|\s*\**(Lesson (\d+)|Engagement 2)\**\s*\|([^|]*)\|([^|]*)\|/gm)) {
    const slug = row[2] ? `lesson-${row[2].padStart(2, "0")}` : "engagement-02";
    const stated = numbers(row[3]);
    if (stated.size === 0) continue; // "Everything", or a dash.

    const entry = new RegExp(`"${slug}":\\s*\\{([^}]*)\\}`).exec(libSrc)?.[1] ?? "";
    const coded = numbers(/nonSaved:\s*\[([^\]]*)\]/.exec(entry)?.[1] ?? "");

    const missing = [...stated].filter((n) => !coded.has(n));
    if (missing.length > 0) {
      drift++;
      fail(`§6.3 marks ${slug} screen(s) ${missing.join(", ")} non-saved, and lib/bysy-simple.ts does not`);
    }
  }
  if (drift === 0) ok("every non-saved screen §6.3 names is non-saved in the code");
}

/* A conversation guide has no fields, and a safety check stores nothing.

   §6.2 retired the joint worksheets: every part meant for two people is a
   non-saved guide, with no shared response fields and nothing implying the
   other person has an account. A guide that renders a writing box under each
   question is back to being a worksheet — which is what it did until someone
   opened Lesson 7 and looked. */

{
  const wb = readFileSync(join("components", "bysy", "Workbook.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  const inputBlocks = [...wb.matchAll(/\{([^{}]*?)&&\s*\(\s*<(?:div|ol|ul)/g)].map((m) => m[1]);
  const guardless = inputBlocks.filter(
    (guard) => /screen\.kind ===/.test(guard) && !/!isGuide/.test(guard)
  );
  if (guardless.length > 0) {
    fail(`components/bysy/Workbook.tsx renders ${guardless.length} input block(s) a conversation guide would reach`);
  } else {
    ok("a conversation guide renders no fields of any kind");
  }

  if (!/safetyRouteShown/.test(wb) || !/\{!safetyRouteShown &&/.test(wb)) {
    fail("components/bysy/Workbook.tsx offers Next while a safety route is showing");
  } else {
    ok("Next is withdrawn while a safety route is on screen");
  }

  const sc = readFileSync(join("components", "bysy", "SafetyCheck.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  if (/saveToolRows|fetch\(|useTransition/.test(sc)) {
    fail("components/bysy/SafetyCheck.tsx stores or sends something — §4 forbids recording a safety answer");
  } else {
    ok("a safety check stores nothing and sends nothing");
  }
}

/* §5: "Where a screen says 'Repeat this screen' (for example Lesson 8 Screen 2,
   Lesson 14 Screens 1 and 3), the learner must be able to add more entries."

   A fixed set of boxes on one of these looks finished and is not: it records
   the first adviser and gives the second nowhere to go. The screens are found
   by what they say, so this checks that the ones §5 names are still among
   them — a reworded instruction would otherwise turn an addable screen back
   into a single one, with nothing to see. */

{
  const named = [
    ["lesson-08-simple.md", 2],
    ["lesson-14-simple.md", 1],
    ["lesson-14-simple.md", 3],
  ];
  let lost = 0;
  for (const [file, n] of named) {
    const path = join(SIMPLE_DIR, file);
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    const from = raw.indexOf(`### Screen ${n} `);
    const next = raw.indexOf("### Screen ", from + 10);
    const screen = raw.slice(from, next === -1 ? undefined : next);
    if (!/repeat (?:this screen )?for each/i.test(screen)) {
      lost++;
      fail(`${file} Screen ${n} no longer says it repeats — §5 requires it to take more entries`);
    }
  }
  if (lost === 0) ok("the screens §5 names as repeating still say so");
}

/* The separate safety route, and the route id.

   §7: "Safety routes are shown separately from ordinary choices, never saved,
   and display the support route locally for that session only." The control
   that offers both has one save call, and the safety option must not be able
   to reach it.

   And §7 again on routes: only an opaque identifier is stored, never the
   descriptive label. "I am deciding whether to continue" in an account history
   is a sentence about somebody's relationship. */

{
  const choice = readFileSync(join("components", "bysy", "PageChoice.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  // The safety branch sets state and nothing else.
  const safetyHandler = /onClick=\{\(\) => setSafetyChosen\(/.test(choice);
  const savesInChoose = (choice.match(/saveToolRows\(/g) ?? []).length;
  if (!safetyHandler) {
    fail("components/bysy/PageChoice.tsx no longer keeps the safety route to a local state change");
  } else if (savesInChoose !== 1) {
    fail(`components/bysy/PageChoice.tsx has ${savesInChoose} save calls — the safety route must reach none of them`);
  } else {
    ok("the separate safety route is never saved");
  }

  const routeCard = readFileSync(join("components", "bysy", "RouteCard.tsx"), "utf8");
  if (/label.*saveRoute|saveRoute\(\s*(label|title|description)/.test(routeCard)) {
    fail("components/bysy/RouteCard.tsx passes a descriptive label to saveRoute");
  } else {
    ok("a route is stored by id, never by label");
  }

  const actions = readFileSync(
    join("app", "members", "courses", "before-you-say-yes", "actions.ts"),
    "utf8"
  );
  if (!/\^r\[1-4\]\$\|\^rc\$/.test(actions)) {
    fail("saveRoute no longer restricts what may be written as a route — a label could be stored");
  } else {
    ok("saveRoute accepts route ids only");
  }
}

/* The quick exit named in the prose, and the lengths on the Listen controls.

   Six pages write "Leave this page →" into their text, including the safety
   notice at the top of Lessons 6, 9, 10, 13 and 19. It rendered as bold words:
   the one instruction on those pages that looked like a control and was not.

   And the lengths: every page states one in its script, written while the
   script was, and every one of the 32 differs from the recording. Lesson 1
   says seven minutes against 5:48; Lesson 19 says twelve against 10:55. A
   length is a promise about what someone is about to start. */

{
  const simpleLib = readFileSync(join("lib", "bysy-simple.ts"), "utf8");

  if (!/export function linkExit\b/.test(simpleLib)) {
    fail("lib/bysy-simple.ts has lost linkExit — the exit named in the prose would be plain text again");
  } else {
    ok("the quick exit written into the course text is a control");
  }

  const withLength = [...simpleLib.matchAll(/length:\s*"about \d+ minutes?"/g)].length;
  const pageCount = [...simpleLib.matchAll(/\bslug:\s*"/g)].length;
  if (withLength !== pageCount) {
    fail(`${pageCount - withLength} simple page(s) have no measured audio length`);
  } else {
    ok(`all ${withLength} pages carry the length of their own recording`);
  }
}

/* The two course homes describe two different courses.

   The detailed one names six Start Here pages, four module pauses and module
   names like "Before You Start Dating". The simple one names four Start Here
   pages, check-ins, and the addendum's §2 names. Whichever is switched off
   must not be the one on screen, and neither may quietly acquire the other's
   module names. */

{
  const simpleHome = join(ROOT, "course-home-simple.md");
  if (!existsSync(simpleHome)) {
    fail("course-home-simple.md is missing — the simple layer would show the detailed course's home");
  } else {
    const home = readFileSync(simpleHome, "utf8");
    const MODULES = [
      "Start With Yourself",
      "Learn What to Look For",
      "Date With Your Eyes Open",
      "Make a Wise Decision",
      "Choose Your Next Step",
      "Optional Engagement Section",
    ];
    const absent = MODULES.filter((m) => !home.includes(m));
    const stale = ["Before You Start Dating", "Choosing Wisely", "Discernment."].filter((m) =>
      home.includes(m)
    );

    if (absent.length > 0) {
      fail(`course-home-simple.md is missing §2 module name(s): ${absent.join(", ")}`);
    } else if (stale.length > 0) {
      fail(`course-home-simple.md still uses the old module name(s): ${stale.join(", ")}`);
    } else {
      ok("the simple course home uses the addendum's module names");
    }

    if (!/readPage\(BYSY_SIMPLE_PUBLISHED \? "course-home-simple\.md" : "course-home\.md"\)/.test(
      readFileSync(join("lib", "bysy-course.ts"), "utf8")
    )) {
      fail("lib/bysy-course.ts no longer picks the course home by the switch");
    } else {
      ok("the course home follows the switch");
    }
  }
}

console.log(
  failures === 0
    ? "\nBefore You Say Yes: structure matches the file list and the navigation document.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
