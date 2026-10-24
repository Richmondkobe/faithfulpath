"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GOAL_LABELS, OUTREACH_GOALS, type OutreachGoal } from "@/lib/outreach";
import type { ProgressEvent, ResearchSummary } from "@/lib/outreach-research";

const inputClass =
  "w-full rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none focus:border-gold-text";
const labelClass = "block text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium";

type Line = { kind: "progress" | "added" | "skipped" | "error"; text: string };

export default function FindSitesPanel({ topics }: { topics: { slug: string; label: string }[] }) {
  const router = useRouter();
  const [goal, setGoal] = useState<OutreachGoal>("backlink");
  const [topic, setTopic] = useState(topics[0]?.slug ?? "");
  const [count, setCount] = useState<5 | 10>(5);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [summary, setSummary] = useState<ResearchSummary | null>(null);
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const logRef = useRef<HTMLOListElement>(null);

  // A clock while it runs, so a long quiet search does not look stuck.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  async function run() {
    setRunning(true);
    setLines([]);
    setSummary(null);
    const t0 = Date.now();
    setStarted(t0);
    setNow(t0);
    const add = (l: Line) => setLines((ls) => [...ls, l]);
    try {
      const res = await fetch("/admin/outreach/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal, topic, count }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        add({ kind: "error", text: j.error ?? `The run could not start (${res.status}).` });
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const raw = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!raw) continue;
          const e = JSON.parse(raw) as ProgressEvent;
          if (e.type === "progress") add({ kind: "progress", text: e.message });
          else if (e.type === "site")
            add(
              e.outcome === "added"
                ? { kind: "added", text: `Added ${e.site}${e.note ? ` (${e.note})` : ""}` }
                : { kind: "skipped", text: `Skipped ${e.site}: ${e.reason}` }
            );
          else if (e.type === "error") add({ kind: "error", text: e.message });
          else if (e.type === "done") setSummary(e.summary);
        }
      }
    } catch {
      add({ kind: "error", text: "The connection dropped before the run finished. Sites saved so far are in the list." });
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  const secs = started ? Math.round(((running ? now : now) - started) / 1000) : 0;

  return (
    <section className="mt-10 rounded-2xl border border-gold-line/50 bg-paper p-6">
      <h2 className="text-2xl text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
        Find sites
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Searches the web for Christian sites that fit, and adds new ones to the list as New. Up to 15 searches a run.
        Emails are kept only if they are published on the site.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_1.4fr_auto]">
        <div>
          <label htmlFor="find-goal" className={labelClass}>Goal</label>
          <select id="find-goal" value={goal} onChange={(e) => setGoal(e.target.value as OutreachGoal)} disabled={running} className={inputClass + " mt-2"}>
            {OUTREACH_GOALS.map((g) => (
              <option key={g} value={g}>{GOAL_LABELS[g]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="find-topic" className={labelClass}>Topic</label>
          <select id="find-topic" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={running} className={inputClass + " mt-2"}>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </select>
        </div>
        <fieldset disabled={running}>
          <legend className={labelClass}>How many</legend>
          <div className="mt-2 flex gap-2">
            {([5, 10] as const).map((n) => (
              <label
                key={n}
                className={
                  "inline-flex cursor-pointer items-center rounded-xl border px-4 py-3 text-sm font-semibold " +
                  (count === n ? "border-navy bg-navy text-paper" : "border-gold-line text-navy hover:bg-cream")
                }
              >
                <input type="radio" name="find-count" value={n} checked={count === n} onChange={() => setCount(n)} className="sr-only" />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={running || !topic}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-3.5 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {running ? `Searching… ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : "Find sites"}
      </button>

      {lines.length > 0 && (
        <ol ref={logRef} aria-live="polite" className="mt-6 max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-line bg-white p-4 text-sm">
          {lines.map((l, i) => (
            <li
              key={i}
              className={
                l.kind === "added" ? "font-medium text-navy" : l.kind === "skipped" ? "text-gold-text" : l.kind === "error" ? "text-danger" : "text-muted"
              }
            >
              {l.text}
            </li>
          ))}
        </ol>
      )}

      {summary && (
        <div role="status" className="mt-6 rounded-xl border border-gold-line bg-cream p-5 text-sm leading-relaxed text-ink">
          <p className="font-semibold text-navy">
            Found {summary.found}, added {summary.added}, skipped {summary.skipped.length}. {summary.searches} searches used.
          </p>
          {summary.emailsFound > 0 && (
            <p className="mt-2">
              {summary.emailsFound} email {summary.emailsFound === 1 ? "address was" : "addresses were"} found published on the
              site by the checker; each site&rsquo;s notes say on which page.
            </p>
          )}
          {summary.emailsBlanked > 0 && (
            <p className="mt-2">
              {summary.emailsBlanked} email {summary.emailsBlanked === 1 ? "address was" : "addresses were"} left blank because{" "}
              {summary.emailsBlanked === 1 ? "it" : "they"} could not be found on the site.
            </p>
          )}
          {summary.skipped.length > 0 && (
            <>
              <p className="mt-3 font-medium text-navy">Skipped after checking</p>
              <ul className="mt-1 list-disc pl-5">
                {summary.skipped.map((s, i) => (
                  <li key={i}>{s.site}: {s.reason}</li>
                ))}
              </ul>
            </>
          )}
          {summary.agentSkipped.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-navy">Rejected by the agent while searching ({summary.agentSkipped.length})</summary>
              <ul className="mt-1 list-disc pl-5">
                {summary.agentSkipped.map((s, i) => (
                  <li key={i}>{s.site}: {s.reason}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
