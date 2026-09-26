"use client";

import { useId, useState } from "react";

import type { TbymSafetyCountries } from "@/lib/tbym-course";

/**
 * "Services in your country" — chosen, never detected.
 *
 * Rule 7 of the build brief: the visitor picks their country. Nothing here reads
 * an IP address, a locale or a timezone, and the choice is not stored or sent
 * anywhere — it changes what this page shows and is forgotten when the page is.
 *
 * Every country in the directory currently has an empty entry list, so every
 * choice shows the emergency-service message and says plainly that no service is
 * listed for that country yet. That is deliberate: the candidate directories in
 * docs/ are marked NOT VERIFIED, and an unverified helpline number on a page
 * like this one is worse than none at all — somebody may ring it in the worst
 * hour of their life. Only the country names are used from those files.
 *
 * The page therefore promises nothing it cannot keep. When a country's entries
 * are verified and written into safety-countries.json, they appear here with no
 * change to this component.
 */
export default function TbymCountryHelp({
  directory,
}: {
  directory: TbymSafetyCountries;
}) {
  const [code, setCode] = useState("");
  const id = useId();
  const chosen = directory.countries.find((c) => c.code === code) ?? null;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[15px] leading-relaxed text-[var(--tb-ink)]"
      >
        Choose your country. This page does not detect where you are, and your
        choice is not saved.
      </label>

      <select
        id={id}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mt-3 w-full max-w-[24rem] rounded-md border border-[var(--tb-line)] bg-[var(--tb-bg)] px-4 py-3 text-[17px] text-[var(--tb-ink)]"
      >
        <option value="">Select a country…</option>
        {directory.countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
        <option value="other">My country is not listed</option>
      </select>

      {code !== "" && (
        <div className="mt-5 rounded-md border border-[var(--tb-line)] bg-[var(--tb-bg)] px-5 py-5">
          <p className="text-[17px] leading-relaxed text-[var(--tb-ink)]">
            If you are in immediate danger, contact the emergency service where
            you are, if you can safely do so.
          </p>

          {chosen && chosen.entries.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {chosen.entries.map((entry) => (
                <li key={entry.name} className="text-[15px] leading-relaxed">
                  <p className="font-semibold text-[var(--tb-ink)]">{entry.name}</p>
                  <p className="text-[var(--tb-ink)]">{entry.what}</p>
                  <p className="text-[var(--tb-mute)]">
                    {entry.contact} · {entry.hours} · {entry.languages} ·{" "}
                    {entry.cost}
                  </p>
                  <p className="text-[var(--tb-mute)]">{entry.phone_bill}</p>
                  <p className="text-[13px] text-[var(--tb-mute)]">
                    Source: {entry.source}. Last verified {entry.verified}.
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--tb-ink)]">
              No verified service is listed for{" "}
              {chosen ? chosen.name : "your country"} yet. Please use the
              emergency number where you are, or ask a doctor, a lawyer or a
              local specialist service for help.
            </p>
          )}

          {directory.international_directory ? (
            <p className="mt-4 text-[15px]">
              <a
                href={directory.international_directory}
                className="text-[var(--tb-accent)] underline underline-offset-4"
              >
                An independently maintained international directory
              </a>
            </p>
          ) : (
            <p className="mt-4">
              <span
                className="inline-block rounded-sm border border-dashed border-[var(--tb-accent)] px-3 py-2 text-[13px] text-[var(--tb-mute)]"
                style={{ fontFamily: "var(--font-tbym-mono)" }}
              >
                International directory — none chosen yet
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
