"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveLeadersAcknowledgement } from "@/app/members/courses/when-your-mind-wont-rest/actions";

/**
 * The single acknowledgement on the leaders' gate page.
 *
 * It unlocks the group downloads and nothing else: no certificate, no approval
 * recorded, and only the tick and its date stored. Un-ticking closes the
 * downloads again, because an acknowledgement that cannot be withdrawn is not
 * really an acknowledgement.
 */
export default function LeadersGate({
  statement,
  downloads,
  checked: initial,
  acknowledgedAt,
}: {
  statement: string;
  downloads: { slug: string; label: string; href: string }[];
  checked: boolean;
  acknowledgedAt: string | null;
}) {
  const [checked, setChecked] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      try {
        await saveLeadersAcknowledgement(next);
        setError(null);
      } catch {
        setChecked(!next);
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#2B2118]">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={toggle}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5E34]"
        />
        <span>{statement}</span>
      </label>

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        This unlocks the group downloads only. It generates no certificate and
        records no approval by Faithful Path. We record that you ticked it and
        the date, and nothing else.
        {acknowledgedAt && (
          <>
            {" "}
            Acknowledged{" "}
            {new Date(acknowledgedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </>
        )}
      </p>

      {checked && (
        <ul className="mt-5 space-y-2 border-t border-[#E5D9C7] pt-5">
          {downloads.map((download) => (
            <li key={download.slug}>
              <Link
                href={download.href}
                prefetch={false}
                className="text-[15px] text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
              >
                {download.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
