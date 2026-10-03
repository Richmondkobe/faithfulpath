#!/usr/bin/env node
//
// The row of topics above the article list shows exactly the categories that
// have something published in them.
//
//   node scripts/verify-category-row.mjs
//
// Rendered against counts made up here rather than against the database, so
// adding a category can be proved to work before any article is filed under
// it — and so proving it costs no live data. Re-filing a published article to
// make a button appear would have been a change to the site to test a change
// to the site.
//
// tsx runs it, for the TypeScript and JSX.

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import CategoryRowModule from "../components/CategoryRow.tsx";
import { CATEGORIES } from "../lib/categories.ts";

// tsx hands back the CommonJS interop object for a .tsx default export, whose
// own .default is the component. React refuses the wrapper as an element type.
const CategoryRow = CategoryRowModule?.default ?? CategoryRowModule;
if (typeof CategoryRow !== "function") {
  throw new Error(`CategoryRow did not resolve to a component (got ${typeof CategoryRow})`);
}

const NEW = "new-to-faith-and-discipleship";

const render = (counts, active) =>
  renderToStaticMarkup(createElement(CategoryRow, { counts, active }));

/** The labels in the row, in the order they appear. */
const labels = (html) =>
  [...html.matchAll(/<(?:a|span)\b[^>]*>([^<]+)<\/(?:a|span)>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'").trim()
  );

let bad = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
  if (!ok) bad++;
};

console.log();

// Every category is defined, in the order the file sets, with the new one first.
check(
  "the new category is defined first",
  CATEGORIES[0]?.slug === NEW,
  `first is ${CATEGORIES[0]?.slug}`
);
check("seven categories are defined", CATEGORIES.length === 7, `${CATEGORIES.length} found`);

// Today's state: the other six have articles, the new one has none.
const asToday = new Map(CATEGORIES.filter((c) => c.slug !== NEW).map((c) => [c.slug, 5]));
const today = render(asToday);
check(
  "with nothing published in it, the new category is not shown",
  !today.includes(NEW),
  `${labels(today).length} buttons: ${labels(today).join(", ")}`
);
check("All is marked as current when nothing is filtered", today.includes('aria-current="page"'));

// One article filed under it, which is all that has to change for the button to
// appear — no deploy, no code.
const withOne = new Map(asToday).set(NEW, 1);
const one = render(withOne);
const shown = labels(one);
check("one published article makes the button appear", one.includes(NEW));
check(
  "it links to its category page",
  one.includes(`href="/articles/category/${NEW}"`),
  one.match(new RegExp(`href="[^"]*${NEW}[^"]*"`))?.[0] ?? "no href"
);
check(
  "it sits first, after All",
  shown[0] === "All" && shown[1] === "New to Faith & Discipleship",
  shown.slice(0, 3).join(" | ")
);
check("eight buttons in total", shown.length === 8, `${shown.length}`);

// Viewing it: marked rather than linked, and All becomes a link back.
const viewing = render(withOne, NEW);
check(
  "when viewed, it is marked rather than linked",
  new RegExp(`<span[^>]*aria-current="page"[^>]*>New to Faith`).test(viewing)
);
check("and All becomes a link back", viewing.includes('href="/articles"'));

// The guard that matters: a category nobody has written for must never be a
// link to an empty page.
const none = render(new Map());
check("with no articles at all, the row renders nothing", none === "");

console.log(bad ? `\n  ${bad} check(s) failed.\n` : "\n  The topic row shows exactly what it should.\n");
process.exitCode = bad ? 1 : 0;
