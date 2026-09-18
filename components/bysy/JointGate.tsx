"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fetchToolRows } from "@/app/members/courses/before-you-say-yes/actions";
import { bysySupportHref } from "@/lib/bysy-links";
import PrivateWorksheet from "@/components/bysy/PrivateWorksheet";

/**
 * The gate every shared section sits behind, for §5.
 *
 * §5 asks for two things before a joint section opens, and they are different
 * things. The private part comes first, always. And the section is not to be
 * completed together where fear, coercion, monitoring or retaliation is
 * present.
 *
 * Neither answer is stored. §4 forbids storing that a learner took a safety
 * path, and "I cannot do this safely" is exactly that: a record of intent on an
 * account somebody else may be reading. So this runs locally and leaves
 * nothing behind — not the question, not the answer, not the fact that it was
 * shown. Closing the page forgets it.
 *
 * The safety answer replaces the section rather than sitting above it. A gate
 * that says "if you are afraid, be careful" and then shows the fields anyway
 * has not gated anything; it has written a disclaimer. This is the same pattern
 * as Lesson 6's next step, for the same reason.
 *
 * The shared section is not passed in as children. Rendering it on the server
 * and handing it to a closed gate ships it in the page payload — the text is in
 * the page source and the browser cache while the gate still looks shut, which
 * on a monitored device is the same exposure as having no gate. A shared record
 * seeded into Lesson 8 was readable in the page source that way. So the gate
 * fetches what it shows, and only once it is open.
 *
 * On the precondition: the check is whether anything has been saved in the
 * private part, but a learner who did that part on paper is not lying when they
 * say they have done it, and a course that called them a liar would be wrong
 * about its own subject. So the precondition can be met by saying so. It is a
 * sequence, not a lock — the point is that nobody arrives at the shared section
 * without having thought alone first, not that the platform holds the key.
 */
export default function JointGate({
  privatePartDone,
  privatePartLabel,
  shared,
}: {
  /** Whether anything has been saved in the private part of this tool. */
  privatePartDone: boolean;
  /** "Part A — My boundaries", as the page itself names it. */
  privatePartLabel: string;
  /** What to render once the gate opens. Its saved rows are fetched then, not before. */
  shared: {
    pageSlug: string;
    part: string;
    areas: string[];
    prompts: string[];
    rowLabel?: string;
    guidance?: string;
  };
}) {
  const [doneAnyway, setDoneAnyway] = useState(false);
  const [safe, setSafe] = useState<"unasked" | "yes" | "no">("unasked");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      try {
        setRows(await fetchToolRows(shared.pageSlug, shared.part));
        setSafe("yes");
        setError(null);
      } catch {
        setError("That could not be opened. Please try again.");
      }
    });
  }

  if (safe === "no") {
    return (
      <section className="mt-6 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-5 py-5">
        <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Do not do this part together
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-[#4A4038]">
          What you have just described is more important than this exercise, and
          it is not a question about the relationship&rsquo;s compatibility any
          more. A conversation that cannot be had freely will not become safer
          for being written down, and a written record of it can be used against
          you.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#4A4038]">
          Speak to someone independent first — a domestic-abuse service, or one
          specialising in forced marriage and family coercion where the pressure
          comes from family or community. Do not raise this with anyone whose
          reaction you fear, and do not agree to mediation as a first response.
        </p>
        <p className="mt-4">
          <Link
            href={bysySupportHref()}
            className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Finding Help Where You Live
          </Link>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
          Nothing about this has been saved to your account, and nothing about
          it is recorded anywhere.
        </p>
      </section>
    );
  }

  if (!privatePartDone && !doneAnyway) {
    return (
      <section className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
        <p className="text-sm leading-relaxed text-[#4A4038]">
          <strong className="font-medium text-[#2B2118]">
            {privatePartLabel} comes first.
          </strong>{" "}
          This part is a conversation about what you have each already thought
          through alone. Going into it without having done that turns it into
          working out what you think in front of the other person, which is a
          harder thing to do honestly.
        </p>
        <p className="mt-4">
          <button
            type="button"
            onClick={() => setDoneAnyway(true)}
            className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            I have done it elsewhere — continue
          </button>
        </p>
      </section>
    );
  }

  if (safe === "unasked") {
    return (
      <section className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
        <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Before you do this part together
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-[#4A4038]">
          Can you both speak freely — disagree, say <em>not yet</em>, or ask
          someone else for counsel — without fear of what would follow?
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <button
            type="button"
            disabled={pending}
            onClick={open}
            className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Opening…" : "Yes — open this part"}
          </button>
          <button
            type="button"
            onClick={() => setSafe("no")}
            className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
          >
            No, or I am not sure
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
          Neither answer is saved.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <div className="mt-6">
      <p className="rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
        Write this down only after you have both agreed the wording. This saves
        to your account alone — the other person has no access to it, nothing
        they write is stored here, and neither of you is required to show the
        other a private worksheet.
      </p>
      <PrivateWorksheet
        pageSlug={shared.pageSlug}
        part={shared.part}
        areas={shared.areas}
        prompts={shared.prompts}
        rowLabel={shared.rowLabel}
        guidance={shared.guidance}
        saved={rows ?? []}
        ownership="shared"
      />
      <p className="mt-4">
        <button
          type="button"
          onClick={() => {
            setRows(null);
            setSafe("unasked");
          }}
          className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Close this part
        </button>
      </p>
    </div>
  );
}
