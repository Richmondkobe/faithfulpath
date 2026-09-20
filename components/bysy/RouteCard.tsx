"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveRoute } from "@/app/members/courses/before-you-say-yes/actions";

/**
 * One of Start Here 3's four ways in.
 *
 * It remembers the choice as an opaque id and goes where the card says. The
 * label never travels: the component is given a route id and a destination,
 * and there is no parameter it could pass a description through even by
 * accident. "I am deciding whether to continue" is a sentence about somebody's
 * relationship, and an account history is the wrong place for it.
 *
 * No page is locked by a route. Choosing one changes where this card sends the
 * learner and what position the detailed pages report — nothing else — and a
 * learner who picks the wrong one can come back and pick again.
 *
 * Saving is a convenience and never blocks the journey: if the write fails the
 * card still navigates, because being unable to record a preference is not a
 * reason to keep somebody on this page.
 */
export default function RouteCard({
  routeId,
  href,
  label,
  description,
}: {
  /** "r1" … "r4". Never a descriptive label. */
  routeId: string;
  href: string;
  label: string;
  description?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await saveRoute(routeId);
          } catch {
            /* a preference, not a gate */
          }
          router.push(href);
        })
      }
      className="w-full rounded-sm border border-[#D9CDBA] px-5 py-4 text-left transition-colors hover:border-[#8B5E34] disabled:opacity-60"
    >
      <span className="block font-medium text-[#2B2118]">
        {pending ? "One moment…" : label}
      </span>
      {description && (
        <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
          {description}
        </span>
      )}
    </button>
  );
}
