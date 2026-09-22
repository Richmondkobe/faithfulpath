"use client";

import { useState, useTransition } from "react";

import {
  saveResetCertificateName,
} from "@/app/members/courses/christian-spiritual-reset/actions";

/**
 * The certificate, offered only with the full-course acknowledgement.
 *
 * It asks for one thing, because one thing is all that goes on it: its note
 * allows the learner's name and the completion date, and no other personal or
 * reflective content. Nothing written here is used anywhere else.
 *
 * The download is a plain link to the shared certificate route, which builds
 * the PDF from the member's own completion record each time and refuses if
 * they have not finished. So the button cannot produce a certificate for
 * somebody who has not earned it, whatever this page believes.
 *
 * The wording under it is the file's own, and it stays: the certificate
 * records participation and completion, and claims nothing about healing,
 * qualification or spiritual approval.
 */
export default function ResetCertificate({
  courseHref,
  saved,
  note,
}: {
  /** The certificate route for this course. */
  courseHref: string;
  saved: string | null;
  note: React.ReactNode;
}) {
  const [name, setName] = useState(saved ?? "");
  const [stored, setStored] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    const clean = name.trim();
    if (!clean) {
      setError("A name is needed to print on the certificate.");
      return;
    }
    startTransition(async () => {
      try {
        await saveResetCertificateName(clean);
        setStored(clean);
        setError(null);
      } catch {
        setError("That did not save. Try again in a moment.");
      }
    });
  }

  return (
    <section className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Certificate of Participation and Completion
      </h3>

      <label className="mt-4 block text-sm text-[#6B5F53]" htmlFor="cert-name">
        The name to print on it
      </label>
      <input
        id="cert-name"
        type="text"
        value={name}
        maxLength={120}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        className="mt-2 w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-[15px] text-[#2B2118] focus:border-[#8B5E34] focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-sm border border-[#D9CDBA] bg-white px-4 py-2 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          {pending ? "Saving…" : stored ? "Update the name" : "Save the name"}
        </button>

        {stored && (
          <a
            href={courseHref}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-center text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Download your certificate
          </a>
        )}
      </div>

      {!stored && (
        <p className="mt-2 text-sm text-[#6B5F53]">
          Save a name and the download will appear.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}

      <div className="mt-4 text-sm leading-relaxed text-[#6B5F53]">{note}</div>
    </section>
  );
}
