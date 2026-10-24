"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveProspectAction, markSentAction, sendProspectAction } from "@/app/admin/outreach/actions";
import type { OutreachProspect } from "@/lib/outreach";

const primary =
  "inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60";
const secondary =
  "inline-flex items-center justify-center rounded-xl border border-gold-line px-5 py-3 text-sm font-semibold text-navy transition-colors hover:border-navy hover:bg-cream disabled:opacity-60";

/**
 * Approve, then Send, for a site with a contact email; Copy email, Open
 * contact page and Mark as sent for one with only a contact page. Shows the
 * saved draft, which is exactly what is sent.
 */
export default function SendPanel({
  p,
  sentToday,
  dailyLimit,
}: {
  p: Pick<OutreachProspect, "id" | "status" | "contact_email" | "contact_page_url" | "draft_subject" | "draft_body" | "sent_at">;
  sentToday: number;
  dailyLimit: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasDraft = Boolean(p.draft_subject?.trim() && p.draft_body?.trim());
  if (!hasDraft) return null;

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; messageId?: string }>, done: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    type R = { ok: boolean; error?: string; messageId?: string };
    const r: R = await fn().catch((): R => ({ ok: false, error: "The connection dropped. Check the site's status before trying again." }));
    setBusy(false);
    setConfirming(false);
    if (r.ok) {
      setMessage(r.messageId ? `${done} Resend message id: ${r.messageId}` : done);
      router.refresh();
    } else {
      setError(r.error ?? "It did not work.");
      router.refresh();
    }
  };

  const sentOn = p.sent_at
    ? new Date(p.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" })
    : null;

  return (
    <section className="mt-8 rounded-2xl border border-gold-line/50 bg-paper p-6">
      <h2 className="text-xl text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
        Send
      </h2>

      {p.status === "sent" && <p className="mt-3 text-sm text-ink">Sent{sentOn ? ` on ${sentOn}` : ""}. This site will not be emailed again.</p>}
      {["replied", "declined", "skipped"].includes(p.status) && (
        <p className="mt-3 text-sm text-muted">This site is marked {p.status}, so it will not be emailed.</p>
      )}

      {p.contact_email && ["drafted", "approved"].includes(p.status) && (
        <>
          <p className="mt-2 text-sm text-muted">
            To {p.contact_email} · {sentToday} of {dailyLimit} sent today
          </p>
          {p.status === "drafted" && (
            <div className="mt-4">
              <button type="button" disabled={busy} className={primary} onClick={() => run(() => approveProspectAction(p.id), "Approved.")}>
                {busy ? "Approving…" : "Approve"}
              </button>
              <p className="mt-2 text-sm text-muted">Approve once you are happy with the draft. Save any edits first.</p>
            </div>
          )}
          {p.status === "approved" && !confirming && (
            <div className="mt-4">
              <button
                type="button"
                disabled={busy || sentToday >= dailyLimit}
                className={primary}
                onClick={() => {
                  setError(null);
                  setConfirming(true);
                }}
              >
                Send
              </button>
              {sentToday >= dailyLimit && <p className="mt-2 text-sm text-gold-text">The daily limit is reached. Send tomorrow.</p>}
            </div>
          )}
          {p.status === "approved" && confirming && (
            <div role="dialog" aria-label="Confirm send" className="mt-4 rounded-xl border border-navy bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold-text">Check before sending</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div><dt className="inline font-semibold text-navy">To: </dt><dd className="inline">{p.contact_email}</dd></div>
                <div><dt className="inline font-semibold text-navy">From: </dt><dd className="inline">Richmond Kobe &lt;info@faithfulpathcommunity.com&gt;</dd></div>
                <div><dt className="inline font-semibold text-navy">Copy to: </dt><dd className="inline">info@faithfulpathcommunity.com (BCC)</dd></div>
                <div><dt className="inline font-semibold text-navy">Subject: </dt><dd className="inline">{p.draft_subject}</dd></div>
              </dl>
              <pre className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-cream p-4 font-sans text-sm leading-relaxed text-ink">
                {p.draft_body}
              </pre>
              <p className="mt-3 text-sm text-muted">This is the saved draft, sent as plain text. Unsaved edits are not included.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" disabled={busy} className={primary} onClick={() => run(() => sendProspectAction(p.id), "Sent.")}>
                  {busy ? "Sending…" : "Send now"}
                </button>
                <button type="button" disabled={busy} className={secondary} onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!p.contact_email && ["drafted", "approved"].includes(p.status) && (
        <div className="mt-4">
          {p.contact_page_url ? (
            <>
              <p className="text-sm text-muted">No email address for this site: send it through their contact page, then mark it sent.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={secondary}
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${p.draft_subject}\n\n${p.draft_body}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                >
                  {copied ? "Copied" : "Copy email"}
                </button>
                <a href={p.contact_page_url} target="_blank" rel="noopener noreferrer" className={secondary}>
                  Open contact page
                </a>
                <button
                  type="button"
                  disabled={busy}
                  className={primary}
                  onClick={() => {
                    if (confirm("Mark this site as sent? Do this only after you have sent it yourself.")) run(() => markSentAction(p.id), "Marked as sent.");
                  }}
                >
                  {busy ? "Saving…" : "Mark as sent"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No contact email or contact page yet. Add one below to send this.</p>
          )}
        </div>
      )}

      {message && <p role="status" className="mt-4 text-sm font-medium text-navy">{message}</p>}
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
