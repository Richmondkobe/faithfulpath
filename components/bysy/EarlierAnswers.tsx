"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fetchEarlierAnswers } from "@/app/members/courses/before-you-say-yes/actions";
import { MONITORING_NOTE } from "@/lib/bysy-wording";
import { bysySupportHref, bysyPageHref } from "@/lib/bysy-links";

/**
 * "View my earlier answers", for §7.
 *
 * Three states, in this order, and the order is the requirement.
 *
 * Closed. Nothing has been fetched and nothing is in the page — not hidden,
 * not collapsed, absent. A collapsed element containing the answers would put
 * them in the page source and the browser cache before the learner asked for
 * anything, which on a monitored device is precisely the exposure §7 is
 * guarding against.
 *
 * Asked. The privacy note first, then a choice. §7 says show the
 * monitoring-privacy note *before* opening them, so it is not a caption
 * underneath what has already appeared.
 *
 * Open. Fetched on request, shown, and closable again. Closing drops them from
 * the page rather than hiding them.
 *
 * Nothing recalled here reaches a notification, preview or email — there are
 * none in this course, and the verifier asserts that none appears.
 */

export type Recall = { pageSlug: string; part: string; label: string };

export default function EarlierAnswers({ refs }: { refs: Recall[] }) {
  const [state, setState] = useState<"closed" | "asked" | "open">("closed");
  const [answers, setAnswers] = useState<
    { pageSlug: string; part: string; rows: string[][] }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const labelFor = (pageSlug: string, part: string) =>
    refs.find((r) => r.pageSlug === pageSlug && r.part === part)?.label ?? pageSlug;

  function reveal() {
    startTransition(async () => {
      try {
        setAnswers(await fetchEarlierAnswers(refs.map(({ pageSlug, part }) => ({ pageSlug, part }))));
        setState("open");
        setError(null);
      } catch {
        setError("Those could not be loaded. Please try again.");
      }
    });
  }

  if (state === "closed") {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setState("asked")}
          className="rounded-sm border border-[#D9CDBA] px-5 py-3 text-sm text-[#2B2118] transition-colors hover:border-[#8B5E34]"
        >
          View my earlier answers
        </button>
        <p className="mt-2 text-sm text-[#6B5F53]">
          Nothing from earlier lessons is shown on this page unless you ask for
          it.
        </p>
      </div>
    );
  }

  if (state === "asked") {
    return (
      <div className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-5 py-5">
        <p className="text-sm leading-relaxed text-[#4A4038]">
          <strong className="font-medium text-[#2B2118]">Privacy and safety.</strong>{" "}
          {MONITORING_NOTE}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#4A4038]">
          Opening these puts what you wrote earlier onto this screen. If someone
          may be able to see this device, leave them closed.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <button
            type="button"
            disabled={pending}
            onClick={reveal}
            className="rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {pending ? "Opening…" : "Show them"}
          </button>
          <button
            type="button"
            onClick={() => setState("closed")}
            className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Not now
          </button>
          <Link
            href={bysySupportHref()}
            className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Finding Help Where You Live
          </Link>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-sm border border-[#E5D9C7] px-5 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Your earlier answers
        </h4>
        <button
          type="button"
          onClick={() => {
            setAnswers([]);
            setState("closed");
          }}
          className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Close and clear from this page
        </button>
      </div>

      <div className="mt-4 space-y-6">
        {answers.map(({ pageSlug, part, rows }) => (
          <section key={`${pageSlug}-${part}`}>
            <p className="font-medium text-[#2B2118]">{labelFor(pageSlug, part)}</p>
            {rows.length === 0 ? (
              <p className="mt-1 text-sm leading-relaxed text-[#6B5F53]">
                You have not written anything here yet.{" "}
                <Link
                  href={bysyPageHref(pageSlug)}
                  className="text-[#8B5E34] underline underline-offset-4"
                >
                  Open that lesson
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {rows.map((row, i) => (
                  <li key={i} className="text-sm leading-relaxed text-[#4A4038]">
                    {row.filter((cell) => cell && cell !== "-").join(" · ")}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[#6B5F53]">
        These are shown here only. Nothing you have written is sent anywhere, and
        none of it appears in an email or a notification.
      </p>
    </div>
  );
}
