"use client";

import { useState } from "react";

/**
 * A list of boxes that are ticked on the page and nowhere else.
 *
 * Lesson 3's five kinds of tiredness, Lesson 8's packing list, Check-in 2's
 * six things to check. Every note that describes them says the same: local
 * only, never saved, submitted, synchronised, analysed or logged, and the
 * labels may not appear in analytics. So the state is React's and that is all
 * — leaving the page forgets them, which is what was asked for.
 *
 * They are not a gate. Nothing waits on them being ticked.
 */
export default function ResetLocalChecks({ items }: { items: string[] }) {
  const [ticked, setTicked] = useState<boolean[]>(items.map(() => false));

  return (
    <ul className="mt-4 space-y-2">
      {items.map((item, i) => (
        <li key={i}>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 transition-colors ${
              ticked[i] ? "border-[#8B5E34] bg-[#F3EADC]" : "border-[#D9CDBA] hover:border-[#8B5E34]"
            }`}
          >
            <input
              type="checkbox"
              checked={ticked[i]}
              onChange={() =>
                setTicked((prev) => prev.map((t, j) => (j === i ? !t : t)))
              }
              className="mt-[3px] h-4 w-4 accent-[#8B5E34]"
            />
            <span className="text-[15px] leading-relaxed text-[#2B2118]">{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
