"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { draftProspect } from "@/app/admin/outreach/actions";

const button =
  "inline-flex items-center justify-center rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-night disabled:opacity-60";

/** "Draft email", or "Redraft" once there is a draft, on a site's detail view. */
export function DraftButton({ id, hasDraft }: { id: string; hasDraft: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-8">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (hasDraft && !confirm("Replace the current draft with a new one? Any edits to it will be lost.")) return;
          setBusy(true);
          setError(null);
          const r = await draftProspect(id).catch(() => ({ ok: false as const, error: "The connection dropped." }));
          setBusy(false);
          if (r.ok) router.refresh();
          else setError(r.error);
        }}
        className={button}
      >
        {busy ? "Writing the draft…" : hasDraft ? "Redraft" : "Draft email"}
      </button>
      <p className="mt-2 text-sm text-muted">
        Reads their site first, then writes a short email for you to check and edit. Nothing is sent.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type Item = { id: string; site_name: string };
type Line = { site: string; ok: boolean; text: string };

/** "Draft all": every New site with a contact, one at a time. */
export function DraftAllButton({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);

  if (items.length === 0 && lines.length === 0) {
    return <p className="mt-6 text-sm text-muted">No New sites with a contact email or contact page to draft.</p>;
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy || items.length === 0}
        onClick={async () => {
          setBusy(true);
          setDone(0);
          setLines([]);
          for (const it of items) {
            const r = await draftProspect(it.id).catch(() => ({ ok: false as const, error: "The connection dropped." }));
            setLines((ls) => [...ls, { site: it.site_name, ok: r.ok, text: r.ok ? `Drafted: “${r.subject}”` : r.error }]);
            setDone((n) => n + 1);
          }
          setBusy(false);
          router.refresh();
        }}
        className={button}
      >
        {busy ? `Drafting ${done + 1} of ${items.length}…` : `Draft all (${items.length})`}
      </button>
      <p className="mt-2 text-sm text-muted">
        Drafts every New site that has a contact email or contact page, one at a time. Nothing is sent.
      </p>
      {lines.length > 0 && (
        <ol aria-live="polite" className="mt-4 space-y-1.5 rounded-xl border border-line bg-white p-4 text-sm">
          {lines.map((l, i) => (
            <li key={i} className={l.ok ? "text-navy" : "text-gold-text"}>
              <span className="font-medium">{l.site}</span> — {l.text}
            </li>
          ))}
          {!busy && (
            <li className="pt-1 font-semibold text-navy">
              {lines.filter((l) => l.ok).length} drafted, {lines.filter((l) => !l.ok).length} not drafted.
            </li>
          )}
        </ol>
      )}
    </div>
  );
}
