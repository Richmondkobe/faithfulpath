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
      <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-8">
        <p
          className="text-xl leading-snug text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          It&rsquo;s yours.
        </p>
        <a
          href={`/api/download/${state.token}`}
          className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Download the PDF
        </a>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#6B5F53]">
          Keep this link — it stays valid, so you can come back to it.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]";

  return (
    <form action={action} className="mt-10 max-w-md">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="key" value={claimKey} />

      <label
        htmlFor="email"
        className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
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
        <p className="mt-3 text-sm text-[#8B3A2E]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
      >
        {pending ? "Preparing…" : "Get the guide"}
      </button>
    </form>
  );
}
