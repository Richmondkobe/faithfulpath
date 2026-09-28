"use client";

import { useId, useState } from "react";

import { Inlines } from "@/components/lbyr/Blocks";
import type { Inline } from "@/lib/lbyr-html";

/**
 * The nine habits on the Finish page, one of which a reader may choose.
 *
 * Private, and deliberately so: the choice lives in this component and nowhere
 * else. Nothing is written to course_progress, nothing is sent anywhere, and
 * closing the page forgets it. The page says as much underneath, and there is
 * no certificate at the end of this course.
 */
export default function LbyrHabitChoice({ items }: { items: Inline[][] }) {
  const name = useId();
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => {
        const id = `${name}-${i}`;
        return (
          <li key={i}>
            <label
              htmlFor={id}
              className="flex min-h-11 cursor-pointer items-start gap-3 text-[18px] leading-relaxed"
            >
              <input
                id={id}
                type="radio"
                name={name}
                checked={chosen === i}
                onChange={() => setChosen(i)}
                className="mt-1.5 h-5 w-5 shrink-0 accent-[#8B5E34]"
              />
              <span>
                <Inlines nodes={item} />
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
