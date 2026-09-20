"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { recordPageProgress } from "@/app/members/courses/before-you-say-yes/actions";

/**
 * Start Here 4's single acknowledgement, to §3.
 *
 * One button. No tick boxes and no per-statement responses, because a record of
 * which safety statements somebody agreed to is a record of what they were
 * worried about. It writes ordinary page progress and nothing else.
 *
 * The support link and the exit control sit above it in the page's own text,
 * where §3 puts them: nobody in danger should have to pass an acknowledgement
 * to reach help.
 */
export default function Acknowledge({
  pageSlug,
  label,
  href,
}: {
  pageSlug: string;
  label: string;
  href: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            // Progress is a convenience; it must never stand between the
            // learner and the next page.
            try {
              await recordPageProgress(pageSlug);
            } catch {
              /* ignore */
            }
            router.push(href);
          })
        }
        className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
      >
        {pending ? "One moment…" : label}
      </button>
    </div>
  );
}
