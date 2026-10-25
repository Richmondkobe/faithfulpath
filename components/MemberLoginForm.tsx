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
  "rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger";
const inputClass =
  "mt-2 w-full rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none placeholder:text-placeholder focus:border-gold-text";
const labelClass =
  "block text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium";
const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60";

export default function MemberLoginForm({
  defaultEmail = "",
  next,
  restartHref = "/members/login",
  codeSentTo,
}: {
  defaultEmail?: string;
  /** Where to land once signed in. The actions accept only an allowed path. */
  next?: string;
  /** This page, for "send another code" and "use a different email". */
  restartHref?: string;
  /** A code has already been sent to this address (the membership thank-you
      page sends one): open on the code box rather than asking for another. */
  codeSentTo?: string;
}) {
  const nextField = next ? <input type="hidden" name="next" value={next} /> : null;
  const withEmail = (email: string) =>
    `${restartHref}${restartHref.includes("?") ? "&" : "?"}email=${encodeURIComponent(email)}`;
  const [sendState, sendAction, sending] = useActionState(
    sendMemberLink,
    codeSentTo ? { error: null, sent: codeSentTo } : initialSend
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
        <div className="rounded-2xl border border-line bg-paper px-5 py-4">
          <p className="text-lg text-navy">Check your email</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A 6-digit code is on its way to{" "}
            <span className="break-words text-navy">{sendState.sent}</span>
            . Type it below. The same email also has a link, which signs you in
            if you open it in this browser. If nothing arrives in a few minutes,
            check your spam folder.
          </p>
        </div>

        <form action={codeAction} className="mt-8 space-y-4">
          <input type="hidden" name="email" value={sendState.sent} />
          {nextField}
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

        <p className="mt-6 text-sm text-muted">
          <a
            href={withEmail(sendState.sent)}
            className="underline underline-offset-4 hover:text-gold-text"
          >
            Send another code
          </a>{" "}
          or{" "}
          <a
            href={restartHref}
            className="underline underline-offset-4 hover:text-gold-text"
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
      {nextField}
      {/* For robots only: off-screen, out of the tab order, and hidden from
          screen readers. A person never fills it; the action ignores any
          submission that does. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Your email
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
