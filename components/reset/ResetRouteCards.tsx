"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveResetRoute } from "@/app/members/courses/christian-spiritual-reset/actions";

export type RouteCard = {
  /** The opaque code. The label never travels with it. */
  id: "r1" | "r2" | "r3";
  label: string;
  body: string;
};

/**
 * Start Here 3's three starting points.
 *
 * Every route goes to Safety and Support first — the page says so in its own
 * words, and the note requires it — so all three cards lead there. Where a
 * learner goes after that is what the code decides, and that is read on the
 * page it matters to rather than acted on here.
 *
 * Choosing completes this page; there is no separate checkbox. A learner may
 * come back and choose again, which changes the suggested next page and keeps
 * everything already finished.
 *
 * The card that is chosen is shown as chosen, and nothing else about it is
 * shown anywhere: the label stays in the browser, and only the code is sent.
 */
export default function ResetRouteCards({
  cards,
  chosen,
  next,
}: {
  cards: RouteCard[];
  chosen: string | null;
  /** Safety and Support, which every route goes through first. */
  next: string;
}) {
  const [picked, setPicked] = useState(chosen);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function choose(id: RouteCard["id"]) {
    setPicked(id);
    startTransition(async () => {
      try {
        await saveResetRoute(id);
        setError(null);
        router.push(next);
      } catch {
        // The choice still stands on the page, and the way on still works;
        // what failed is remembering it for next time.
        setError("That did not save. You can still continue, and choose again later.");
      }
    });
  }

  return (
    <div className="mt-6">
      <ul className="space-y-3">
        {cards.map((card) => {
          const selected = picked === card.id;
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={pending}
                onClick={() => choose(card.id)}
                className={`w-full rounded-sm border px-5 py-4 text-left transition-colors ${
                  selected
                    ? "border-[#8B5E34] bg-[#F3EADC]"
                    : "border-[#D9CDBA] hover:border-[#8B5E34]"
                }`}
              >
                <span className="block font-medium text-[#2B2118]">{card.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
                  {card.body}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#8B3A2E]">
          {error}
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
        Every starting point goes through Safety and Support first. You can
        return here and change this at any time, and nothing you have finished
        is lost.
      </p>
    </div>
  );
}
