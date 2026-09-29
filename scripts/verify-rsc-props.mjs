#!/usr/bin/env node
//
// No Server Component passes a function to a Client Component.
//
//   node scripts/verify-rsc-props.mjs
//
// React cannot serialise a function across that boundary. It throws
// "Functions cannot be passed directly to Client Components" — and on a
// dynamic page it throws at request time, not at build, so the build is green
// and the page is broken for whoever loads it. That is exactly how a broken
// lesson reached a preview: `art={(key) => …}` on a page too dynamic to
// prerender.
//
// This looks for an arrow function or a bare function passed as a prop, in a
// file without "use client", to a component that has it. Event handlers are
// not exempt: a Server Component cannot pass those either.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const files = ["app", "components"].flatMap(walk).filter((f) => f.endsWith(".tsx"));
const source = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/** Components declared in a "use client" file, by their exported name. */
const clientComponents = new Set();
for (const code of source.values()) {
  if (!/^\s*["']use client["']/.test(code)) continue;
  for (const m of code.matchAll(/export default function (\w+)/g)) clientComponents.add(m[1]);
  for (const m of code.matchAll(/export function (\w+)/g)) clientComponents.add(m[1]);
}

let bad = 0;
for (const [file, code] of source) {
  if (/^\s*["']use client["']/.test(code)) continue;      // client-to-client is fine

  // Which client components this server file actually renders.
  const used = [...clientComponents].filter((name) =>
    new RegExp(`<${name}[\\s/>]`).test(code)
  );
  if (!used.length) continue;

  for (const name of used) {
    // The opening tag, up to its closing bracket.
    const re = new RegExp(`<${name}\\b([\\s\\S]*?)/?>(?=\\s*[<{\\n])`, "g");
    for (const m of code.matchAll(re)) {
      const props = m[1];
      const fn = props.match(/(\w+)=\{\s*(?:\([^)]*\)|\w+)\s*=>/);
      if (fn) {
        console.log(`  ${file}`);
        console.log(`     <${name} ${fn[1]}={…} => …}  — a function prop to a Client Component`);
        bad++;
      }
    }
  }
}

if (bad) {
  console.log(`\n  ${bad} function prop(s) crossing a Server/Client boundary.`);
  console.log("  Resolve the value on the server and pass that instead.\n");
  process.exitCode = 1;
} else {
  console.log("\n  No Server Component passes a function to a Client Component.\n");
}
