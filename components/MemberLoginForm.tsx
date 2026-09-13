"use client";

import { useActionState } from "react";
import {
  sendMemberLink,
  verifyMemberCode,
  type MemberCodeState,
  type MemberLoginState,
} from "@/app/members/actions";

const initialSend: MemberLoginState = { error: null, sent: null };
const initialCode: MemberCodeState = { error: null };

const errorClass =
  "rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]";
const inputClass =
  "mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]";
const labelClass =
  "block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]";
const buttonClass =
  "inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60";

export default function MemberLoginForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const [sendState, sendAction, sending] = useActionState(
    sendMemberLink,
    initialSend
  );
  const [codeState, codeAction, verifying] = useActionState(
    verifyMemberCode,
    initialCode
  );

  // Once the email is on its way the code field takes over the page. Starting
  // over is a plain link back to this page, which clears both action states.
  if (sendState.sent) {
    return (
      <div className="mt-10 max-w-md">
        <div className="rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4">
          <p className="text-lg text-[#2B2118]">Check your email</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
            A 6-digit code is on its way to{" "}
            <span className="break-words text-[#2B2118]">{sendState.sent}</span>
            . Type it below. The same email also has a link, which signs you in
            if you open it in this browser. If nothing arrives in a few minutes,
            check your spam folder.
          </p>
        </div>

        <form action={codeAction} className="mt-8 space-y-4">
          <input type="hidden" name="email" value={sendState.sent} />
          <div>
            <label htmlFor="token" className={labelClass}>
              Enter the 6-digit code from your email
            </label>
            <input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              placeholder="000000"
              className={`${inputClass} tracking-[0.4em]`}
            />
          </div>

          {codeState.error && (
            <p role="alert" className={errorClass}>
              {codeState.error}
            </p>
          )}

          <button type="submit" disabled={verifying} className={buttonClass}>
            {verifying ? "Signing you in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#6B5F53]">
          <a
            href={`/members/login?email=${encodeURIComponent(sendState.sent)}`}
            className="underline underline-offset-4 hover:text-[#8B5E34]"
          >
            Send another code
          </a>{" "}
          or{" "}
          <a
            href="/members/login"
            className="underline underline-offset-4 hover:text-[#8B5E34]"
          >
            use a different email
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={sendAction} className="mt-10 max-w-md space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email you paid with
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="your@email.com"
          className={inputClass}
        />
      </div>

      {sendState.error && (
        <p role="alert" className={errorClass}>
          {sendState.error}
        </p>
      )}

      <button type="submit" disabled={sending} className={buttonClass}>
        {sending ? "Sending…" : "Email me a 6-digit code"}
      </button>
    </form>
  );
}
