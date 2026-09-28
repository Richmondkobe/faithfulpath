"use client";

import { useId, useState } from "react";

import { Inlines } from "@/components/lbyr/Blocks";
import type { Inline } from "@/lib/lbyr-html";

/**
 * Lesson 3's six tick-boxes.
 *
 * They exist so a reader can see at a glance which of the six are true of
 * them, and that is all they do. The state lives in this component and nowhere
 * else — nothing is written to course_progress, nothing is sent anywhere, and
 * closing the page forgets it. The brief is explicit about that, and so is the
 * sentence above the list.
 */
export default function LbyrCheckList({ items }: { items: Inline[][] }) {
  const base = useId();
  const [ticked, setTicked] = useState<boolean[]>(() => items.map(() => false));

  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => {
        const id = `${base}-${i}`;
        return (
          <li key={i}>
            <label
              htmlFor={id}
              className="flex min-h-11 cursor-pointer items-start gap-3 text-[18px] leading-relaxed"
            >
              <input
                id={id}
                type="checkbox"
                checked={ticked[i]}
                onChange={() =>
                  setTicked((was) => was.map((v, j) => (j === i ? !v : v)))
                }
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
