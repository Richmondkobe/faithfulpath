"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initial: LoginState = { error: null };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  const inputClass =
    "w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]";

  return (
    <form action={action} className="mt-8 max-w-sm space-y-3">
      <div>
        <label
          htmlFor="email"
          className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
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
          className="block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
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
        <p className="text-sm text-[#8B3A2E]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
