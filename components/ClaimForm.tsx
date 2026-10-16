"use client";

import { useActionState } from "react";
import { claimGuide, type ClaimState } from "@/app/guides/[slug]/claim/actions";

const initial: ClaimState = { error: null, token: null };

export default function ClaimForm({
  slug,
  claimKey,
}: {
  slug: string;
  claimKey: string;
}) {
  const [state, action, pending] = useActionState(claimGuide, initial);

  if (state.token) {
    return (
      <div className="mt-10 rounded-xl border border-line bg-sand px-7 py-8">
        <p
          className="text-xl leading-snug text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          It&rsquo;s yours.
        </p>
        <a
          href={`/api/download/${state.token}`}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Download the PDF
        </a>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">
          Keep this link — it stays valid, so you can come back to it.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none placeholder:text-placeholder focus:border-gold-text";

  return (
    <form action={action} className="mt-10 max-w-md">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="key" value={claimKey} />

      <label
        htmlFor="email"
        className="block text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
      >
        Your email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="your@email.com"
        className={inputClass + " mt-2"}
      />

      {state.error && (
        <p className="mt-3 text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Preparing…" : "Get the guide"}
      </button>
    </form>
  );
}
