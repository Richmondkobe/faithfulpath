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

/* §6: verification metadata lives beside the source file.

   The point of the register is not that it is full — most of it is honestly
   marked "not recorded" — but that a helpline cannot be added to the page
   without one. An entry with no record at all is an entry nobody has been asked
   to check, and this is what asks. */

const REGISTER = join("content", "before-you-say-yes-resources-verification.json");
const RESOURCES = join("content", "before-you-say-yes-resources-page.md");
if (!existsSync(REGISTER)) {
  fail(`${REGISTER} is missing — §6 requires verification metadata beside the source file`);
} else if (!existsSync(RESOURCES)) {
  fail(`${RESOURCES} is missing`);
} else {
  const register = JSON.parse(readFileSync(REGISTER, "utf8"));
  const { readEntries } = await import("./bysy-resource-register.mjs");
  const onPage = readEntries(readFileSync(RESOURCES, "utf8"));
  const recorded = new Set(register.entries.map((e) => `${e.section}::${e.name}`));
  const missing = onPage.filter((e) => !recorded.has(`${e.section}::${e.name}`));

  if (missing.length > 0) {
    for (const e of missing.slice(0, 5)) {
      fail(`"${e.name}" (${e.section}) is on the resources page with no verification record`);
    }
    if (missing.length > 5) fail(`…and ${missing.length - 5} more with no verification record`);
  } else {
    const filed = register.entries.filter((e) =>
      register.fields.every((f) => e[f] !== "not recorded")
    ).length;
    ok(`all ${onPage.length} resource entries have a verification record (${filed} with evidence filed)`);
  }
}

console.log(
  failures === 0
    ? "\nBefore You Say Yes: structure matches the file list and the navigation document.\n"
    : `\n${failures} failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
