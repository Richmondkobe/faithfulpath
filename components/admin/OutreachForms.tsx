"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  addProspect,
  updateProspect,
  type OutreachFormState,
} from "@/app/admin/outreach/actions";
import {
  GOAL_LABELS,
  OUTREACH_GOALS,
  OUTREACH_STATUSES,
  STATUS_LABELS,
  domainFromUrl,
  type OutreachProspect,
} from "@/lib/outreach";

const initial: OutreachFormState = { error: null };

const inputClass =
  "w-full rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none placeholder:text-placeholder focus:border-gold-text";

const labelClass =
  "block text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Message({ state }: { state: OutreachFormState }) {
  if (!state.error) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger">
      {state.error}
      {state.duplicate && (
        <>
          {" "}
          <Link
            href={`/admin/outreach/${state.duplicate.id}`}
            className="font-medium underline underline-offset-4"
          >
            Open {state.duplicate.site_name}
          </Link>
        </>
      )}
    </div>
  );
}

/** The fields the Add form and the detail view share. */
function SiteFields({
  v,
  showContactName,
  articlePaths,
  prefix,
}: {
  /** The value to start each field with. */
  v: (name: string) => string;
  showContactName: boolean;
  articlePaths: string[];
  prefix: string;
}) {
  const [url, setUrl] = useState(v("site_url"));
  const domain = domainFromUrl(url);
  const id = (name: string) => `${prefix}-${name}`;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Site name" htmlFor={id("site_name")}>
          <input id={id("site_name")} name="site_name" required defaultValue={v("site_name")} className={inputClass} />
        </Field>
        <Field
          label="Web address"
          htmlFor={id("site_url")}
          hint={domain ? <>Domain: <span className="font-medium text-navy">{domain}</span></> : "For example christianblog.org"}
        >
          <input
            id={id("site_url")}
            name="site_url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Contact email" htmlFor={id("contact_email")}>
          <input id={id("contact_email")} name="contact_email" type="email" defaultValue={v("contact_email")} className={inputClass} />
        </Field>
        <Field label="Contact page" htmlFor={id("contact_page_url")}>
          <input id={id("contact_page_url")} name="contact_page_url" defaultValue={v("contact_page_url")} placeholder="https://" className={inputClass} />
        </Field>
      </div>
      {showContactName && (
        <Field label="Contact name" htmlFor={id("contact_name")}>
          <input id={id("contact_name")} name="contact_name" defaultValue={v("contact_name")} className={inputClass} />
        </Field>
      )}
      <Field label="Goal" htmlFor={id("goal")} hint="What you are asking them for.">
        <select id={id("goal")} name="goal" defaultValue={v("goal") || "backlink"} className={inputClass + " sm:max-w-xs"}>
          {OUTREACH_GOALS.map((g) => (
            <option key={g} value={g}>
              {GOAL_LABELS[g]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Why relevant" htmlFor={id("why_relevant")} hint="A short note on why this site fits.">
        <textarea id={id("why_relevant")} name="why_relevant" rows={2} defaultValue={v("why_relevant")} className={inputClass + " leading-relaxed"} />
      </Field>
      <Field label="Suggested page" htmlFor={id("suggested_page")} hint="Which of your articles fits them. Start typing to pick one.">
        <input
          id={id("suggested_page")}
          name="suggested_page"
          list={id("articles")}
          defaultValue={v("suggested_page")}
          placeholder="/articles/…"
          className={inputClass}
        />
        <datalist id={id("articles")}>
          {articlePaths.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </Field>
    </>
  );
}

export function AddProspectForm({ articlePaths }: { articlePaths: string[] }) {
  const [state, action, pending] = useActionState(addProspect, initial);
  // After an error the fields show what was typed; after a save they are empty.
  const v = (name: string) => state.values?.[name] ?? "";

  return (
    <form action={action} className="mt-6 max-w-3xl space-y-6">
      <SiteFields key={state.nonce ?? 0} v={v} showContactName={false} articlePaths={articlePaths} prefix="add" />
      <Message state={state} />
      {state.saved && <p role="status" className="text-sm text-gold-text">Added to the list.</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-3.5 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add site"}
      </button>
    </form>
  );
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function ProspectForm({ p, articlePaths }: { p: OutreachProspect; articlePaths: string[] }) {
  const [state, action, pending] = useActionState(updateProspect, initial);
  // After an error the fields show what was typed, not the saved values.
  const v = (name: string): string => {
    if (state.values) return state.values[name] ?? "";
    const saved = p[name as keyof OutreachProspect];
    if (name === "sent_at" || name === "replied_at") return day(saved as string | null);
    return (saved as string | null) ?? "";
  };

  return (
    <form key={state.nonce ?? 0} action={action} className="mt-10 max-w-3xl space-y-7">
      <input type="hidden" name="id" value={p.id} />

      <Field label="Status" htmlFor="status" hint="Marking a site Sent or Replied records today's date, unless a date is already set.">
        <select id="status" name="status" defaultValue={v("status")} className={inputClass + " sm:max-w-xs"}>
          {OUTREACH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <SiteFields v={v} showContactName articlePaths={articlePaths} prefix="edit" />

      <Field label="Email subject" htmlFor="draft_subject">
        <input id="draft_subject" name="draft_subject" defaultValue={v("draft_subject")} className={inputClass} />
      </Field>
      <Field label="Email draft" htmlFor="draft_body">
        <textarea id="draft_body" name="draft_body" rows={12} defaultValue={v("draft_body")} className={inputClass + " leading-relaxed"} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Sent on" htmlFor="sent_at">
          <input id="sent_at" name="sent_at" type="date" defaultValue={v("sent_at")} className={inputClass} />
        </Field>
        <Field label="Replied on" htmlFor="replied_at">
          <input id="replied_at" name="replied_at" type="date" defaultValue={v("replied_at")} className={inputClass} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" rows={5} defaultValue={v("notes")} className={inputClass + " leading-relaxed"} />
      </Field>

      <Message state={state} />

      <div className="flex items-center gap-6 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href="/admin/outreach" className="text-sm text-muted transition-colors hover:text-gold-text">
          Back to the list
        </Link>
      </div>
    </form>
  );
}
