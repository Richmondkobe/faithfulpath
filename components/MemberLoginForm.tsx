"use client";

import { useActionState } from "react";
import { sendMemberLink, type MemberLoginState } from "@/app/members/actions";

const initial: MemberLoginState = { error: null, sent: null };

export default function MemberLoginForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(sendMemberLink, initial);

  if (state.sent) {
    return (
      <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4">
        <p className="text-lg text-[#2B2118]">Check your email</p>
        <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
          A sign-in link is on its way to{" "}
          <span className="break-words text-[#2B2118]">{state.sent}</span>. It
          opens the membership on this device. If it has not arrived in a few
          minutes, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10 max-w-md space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
        >
          Email you paid with
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="your@email.com"
          className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
