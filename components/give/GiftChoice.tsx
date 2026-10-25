"use client";

import { useState } from "react";
import { MAX_GIFT, MIN_GIFT, parseGiftAmount, type GiftKind } from "@/lib/giving";

/**
 * One of the two choices on /give: amount buttons, an "Other" amount, and the
 * button to Stripe Checkout. A plain form posting to /api/give/checkout, so it
 * works before the page's JavaScript has loaded; the script only keeps the
 * button's wording in step with the amount.
 */
export default function GiftChoice({
  kind,
  amounts,
  initial,
  title,
  lead,
  recommended = false,
}: {
  kind: GiftKind;
  amounts: readonly number[];
  initial: number;
  title: string;
  lead: string;
  recommended?: boolean;
}) {
  const [picked, setPicked] = useState<string>(String(initial));
  const [custom, setCustom] = useState("");
  const monthly = kind === "monthly";
  const cents = parseGiftAmount(picked === "other" ? custom : picked);
  const shown = cents ? `US$${cents % 100 ? (cents / 100).toFixed(2) : cents / 100}` : null;
  const id = `gift-${kind}`;
  const dark = recommended;

  return (
    <form
      method="POST"
      action="/api/give/checkout"
      aria-labelledby={`${id}-title`}
      className={`relative flex flex-col rounded-2xl p-6 ${dark ? "bg-navy text-sand" : "border border-gold-line/60 bg-paper"}`}
    >
      <input type="hidden" name="kind" value={kind} />
      {recommended && (
        <p className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-night">
          Recommended
        </p>
      )}
      <h2
        id={`${id}-title`}
        className={`mt-1 text-2xl ${dark ? "text-sun" : "text-navy"}`}
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {title}
      </h2>
      <p className={`mt-2 leading-relaxed ${dark ? "text-sand" : ""}`}>{lead}</p>

      <fieldset className="mt-5">
        <legend className={`text-[13px] font-medium uppercase tracking-[0.12em] ${dark ? "text-gold-soft" : "text-gold-text"}`}>
          {monthly ? "Amount each month" : "Amount"}
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...amounts.map(String), "other"].map((value) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="amount"
                value={value}
                checked={picked === value}
                onChange={() => setPicked(value)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-[16px] font-semibold transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
                  dark
                    ? "border-sand/40 text-sun peer-checked:border-gold peer-checked:bg-gold peer-checked:text-night"
                    : "border-gold-line/60 bg-white text-navy peer-checked:border-gold peer-checked:bg-gold peer-checked:text-night"
                }`}
              >
                {value === "other" ? "Other" : `US$${value}`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {picked === "other" && (
        <div className="mt-4">
          <label htmlFor={`${id}-custom`} className={`block text-[13px] font-medium uppercase tracking-[0.12em] ${dark ? "text-gold-soft" : "text-gold-text"}`}>
            Your amount in US dollars{monthly ? ", each month" : ""}
          </label>
          <div className="relative mt-2">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-navy">
              US$
            </span>
            <input
              id={`${id}-custom`}
              name="custom"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              required
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-describedby={`${id}-min`}
              className="w-full rounded-xl border border-field bg-white py-3 pr-4 pl-14 text-base text-navy outline-none focus:border-gold-text"
            />
          </div>
          <p id={`${id}-min`} className={`mt-1 text-[13px] ${dark ? "text-sand" : "text-muted"}`}>
            At least US${MIN_GIFT}, and up to US${MAX_GIFT.toLocaleString("en-US")}.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!cents}
        className="mt-6 flex min-h-14 w-full items-center justify-center rounded-xl bg-gold px-6 text-[17px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {shown ? (monthly ? `Give ${shown} a month` : `Give ${shown} once`) : "Choose an amount"}
      </button>
      <p className={`mt-3 text-center text-[13px] ${dark ? "text-sand" : "text-muted"}`}>
        {monthly ? "Secure payment with Stripe. Cancel any time." : "Secure payment with Stripe."}
      </p>
    </form>
  );
}
