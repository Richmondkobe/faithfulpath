"use client";

import { useState } from "react";
import Link from "next/link";
import { bysySupportHref, bysyPageHref } from "@/lib/bysy-links";

/**
 * Lesson 6's next faithful step.
 *
 * Three constraints shape this, and between them they rule out almost
 * everything a form would normally do.
 *
 * §4 names Lesson 6's next-step options among the things never stored, so there
 * is no server action here, no fetch, and no state that outlives the page. The
 * lesson asks the learner to write down a person and a date; §4 also names a
 * planned action arising from a safety concern, and any date attached to one,
 * so those are not fields. The instruction stays, and the writing happens
 * somewhere this course cannot reach.
 *
 * §3 says a safety route is displayed immediately and replaces the other
 * options rather than sitting beside them. The two serious options therefore
 * take over the section rather than adding a note beneath it — a learner who
 * has just recognised a pattern should not be reading four choices, one of
 * which is theirs.
 *
 * §2 says nothing scores. Four options, no combination, no verdict, and the
 * line that says so stays on screen whichever is chosen.
 */

type Option = {
  id: string;
  title: string;
  body: string;
  /** Indicates a safety concern: takes over the section when chosen. */
  safety?: boolean;
};

const OPTIONS: Option[] = [
  {
    id: "a",
    title: "No significant concern",
    body: "Continue observing without becoming suspicious.",
  },
  {
    id: "b",
    title: "Unclear or lower-level concern",
    body: "Slow down and seek an independent perspective.",
  },
  {
    id: "c",
    title: "Repeated controlling behaviour, or one serious incident",
    body: "Seek individual professional or specialist advice before confronting the person.",
    safety: true,
  },
  {
    id: "d",
    title: "Immediate danger, violence, sexual coercion, stalking or credible threats",
    body: "Prioritise safety and emergency or specialist support. This step replaces the others; do not wait to finish the course.",
    safety: true,
  },
];

export default function NextStepOptions() {
  // Local only. Nothing here is written anywhere, and it is gone on reload.
  const [chosen, setChosen] = useState<Option | null>(null);

  if (chosen?.safety) {
    return (
      <section className="mt-6 rounded-sm border border-[#8B3A2E] bg-[#FBF1EF] px-5 py-5">
        <h3
          className="text-xl text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {chosen.id === "d"
            ? "Your safety comes before the rest of this course"
            : "Seek individual advice before you act"}
        </h3>

        <p className="mt-3 leading-relaxed text-[#4A4038]">{chosen.body}</p>

        {chosen.id === "d" && (
          <p className="mt-3 leading-relaxed text-[#4A4038]">
            If you are in immediate danger, contact the emergency service where
            you are, or go to the safest place available to you. Do not wait to
            finish this lesson.
          </p>
        )}

        <p className="mt-3 leading-relaxed text-[#4A4038]">
          Do not raise this with the person using a worksheet from this course.
          Speak to a specialist service first — they can help you think about
          timing and safety in a way a checklist cannot.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Link
            href={bysySupportHref()}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Finding Help Where You Live
          </Link>
          <Link
            href={bysyPageHref("lesson-19-when-to-walk-away")}
            className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Lesson 19 — ending safely
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setChosen(null)}
          className="mt-5 text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Go back to the four options
        </button>

        <p className="mt-4 text-sm leading-relaxed text-[#6B5F53]">
          Nothing you selected here has been saved, and nothing about this
          choice is recorded anywhere in your account.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <p className="leading-relaxed">
        Choose the one that fits, then write the name of one person you will talk
        to and the date you will do it. Write it somewhere outside this course.
      </p>

      <ul className="mt-5 space-y-3">
        {OPTIONS.map((option) => {
          const selected = chosen?.id === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setChosen(selected ? null : option)}
                className={`w-full rounded-sm border px-5 py-4 text-left transition-colors ${
                  selected
                    ? "border-[#8B5E34] bg-[#F3EADC]"
                    : "border-[#D9CDBA] hover:border-[#8B5E34]"
                }`}
              >
                <span className="block font-medium text-[#2B2118]">
                  {option.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
                  {option.body}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-sm leading-relaxed text-[#6B5F53]">
        No combination of answers produces this decision, and nothing here is
        scored. Your selection is not saved — it is yours to act on, not a
        record for us to keep.
      </p>
    </section>
  );
}
