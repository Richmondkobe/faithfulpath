"use client";

import { useActionState } from "react";
import {
  sendCommunityCode,
  verifyCommunityCode,
  type CommunityCodeSendState,
  type CommunityCodeState,
} from "@/app/community/actions";
import { COUNTRY_MAX, FULL_NAME_MAX } from "@/lib/community";
import { buttonClass, errorClass, inputClass, labelClass } from "@/components/community/styles";

const initialCode: CommunityCodeState = { error: null };

/**
 * Joining the community, or signing back in to it: the same 6-digit code as
 * the membership sign-in. "join" also asks for a full name and country,
 * which are saved once the code is typed in.
 */
export default function JoinForm({
  mode,
  stamp,
  restartHref,
}: {
  mode: "join" | "sign-in";
  /** Signed when the page was opened (lib/form-stamp.ts). */
  stamp: string;
  restartHref: string;
}) {
  const initialSend: CommunityCodeSendState = { error: null, sent: null, fullName: "", country: "" };
  const [sendState, sendAction, sending] = useActionState(sendCommunityCode, initialSend);
  const [codeState, codeAction, verifying] = useActionState(verifyCommunityCode, initialCode);

  if (sendState.sent) {
    return (
      <div className="mt-8 max-w-md">
        <div className="rounded-2xl border border-line bg-paper px-5 py-4">
          <p className="text-lg text-navy">Check your email</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {mode === "join" ? (
              <>A 6-digit code is on its way to </>
            ) : (
              <>If that address has joined the community, a 6-digit code is on its way to </>
            )}
            <span className="break-words text-navy">{sendState.sent}</span>. Type it below. If nothing arrives in a few
            minutes, check your spam folder.
          </p>
        </div>

        <form action={codeAction} className="mt-8 space-y-4">
          <input type="hidden" name="email" value={sendState.sent} />
          <input type="hidden" name="full_name" value={sendState.fullName} />
          <input type="hidden" name="country" value={sendState.country} />
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
            {verifying ? "Signing you in…" : mode === "join" ? "Join the community" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          <a href={restartHref} className="underline underline-offset-4 hover:text-gold-text">
            Start again with a different email
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={sendAction} className="mt-8 max-w-md space-y-5">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="stamp" value={stamp} />
      {/* For robots only: off-screen, out of the tab order, hidden from screen
          readers. A person never fills it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {mode === "join" && (
        <>
          <div>
            <label htmlFor="full_name" className={labelClass}>
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              maxLength={FULL_NAME_MAX}
              defaultValue={sendState.fullName}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>
              Country you live in
            </label>
            <input
              id="country"
              name="country"
              type="text"
              required
              autoComplete="country-name"
              maxLength={COUNTRY_MAX}
              defaultValue={sendState.country}
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="your@email.com" className={inputClass} />
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
