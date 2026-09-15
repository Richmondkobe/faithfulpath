"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveMindCertificateName } from "@/app/members/courses/when-your-mind-wont-rest/actions";
import { MIND_BASE } from "@/lib/mind-links";

/**
 * The name for the certificate and the badge, and the links to them.
 *
 * Eligibility is shown as a plain count, never as a nag. A member who has not
 * finished is told what remains, not that they are behind.
 */
export default function CertificateBlock({
  savedName,
  done,
  total,
  journeyReached30,
}: {
  savedName: string;
  done: number;
  total: number;
  journeyReached30: boolean;
}) {
  const [name, setName] = useState(savedName);
  const [stored, setStored] = useState(savedName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const certificateReady = done >= total;
  const anything = certificateReady || journeyReached30;
  if (!anything) return null;

  function save() {
    startTransition(async () => {
      try {
        await saveMindCertificateName(name);
        setStored(name.trim());
        setError(null);
      } catch {
        setError("That could not be saved. Please try again.");
      }
    });
  }

  return (
    <section
      id="certificate-name"
      className="mt-12 scroll-mt-24 rounded-sm border border-[#8B5E34] bg-[#F3EADC] px-5 py-5"
    >
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {certificateReady && journeyReached30
          ? "Your certificate and badge"
          : certificateReady
            ? "Your certificate"
            : "Your badge"}
      </h2>

      <label htmlFor="cert-name" className="mt-4 block text-sm text-[#4A4038]">
        The name to print
      </label>
      <div className="mt-2 flex flex-wrap gap-3">
        <input
          id="cert-name"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name, as you would like it written"
          className="min-w-0 flex-1 rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
        />
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-sm border border-[#D9CDBA] bg-white px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save name"}
        </button>
      </div>

      {stored ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {certificateReady && (
            <Link
              href={`${MIND_BASE}/certificate`}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
            >
              Download your certificate
            </Link>
          )}
          {journeyReached30 && (
            <Link
              href={`${MIND_BASE}/badge`}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] bg-white px-7 py-4 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34]"
            >
              Download your 30-day badge
            </Link>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
          Add a name and save it, and the download will appear here.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}
    </section>
  );
}
