"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initial: LoginState = { error: null };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  const inputClass =
    "w-full rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none placeholder:text-placeholder focus:border-gold-text";

  return (
    <form action={action} className="mt-8 max-w-sm space-y-3">
      <div>
        <label
          htmlFor="email"
          className="block text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@faithfulpathcommunity.com"
          className={inputClass + " mt-2"}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass + " mt-2"}
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
