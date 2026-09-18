"use client";

import { useState } from "react";
import Link from "next/link";
import { bysySupportHref } from "@/lib/bysy-links";
import { NOTHING_SCORES } from "@/lib/bysy-wording";
import type { Choice } from "@/lib/bysy-types";

/**
 * A list of next steps where one of them is a safety route, for §3.
 *
 * §3's routing rule: where a learner indicates a safety concern, the support
 * route is displayed immediately and replaces the other options — it never sits
 * beside them as one choice among several. Lesson 6 was the first place this
 * was built; these pages are the rest of them.
 *
 * Two shapes of safety appear in this content, and they are treated
 * differently because they are different things.
 *
 * An option that says it replaces the others is the route itself. Choosing it
 * takes over the section. Nobody who has just recognised they are unsafe should
 * be reading five other options with theirs among them.
 *
 * An option carrying a conditional caveat — *if you fear their reaction*,
 * *where coercion or threats are present* — is an ordinary step with a fork in
 * front of it. §3 says safety forks come before ordinary procedural advice on
 * the same page, so the caveat leads and the ordinary step follows it, rather
 * than trailing at the end of a paragraph where it reads as a footnote.
 *
 * §2 asks that an ordinary choice be reflected back and remain changeable, and
 * that a safety-related one never be reflected at all. So the reflection below
 * is only ever of an ordinary option, and it lives in the session rather than
 * the account: reflecting it without storing it satisfies both halves, and a
 * store that had to decide which choices were safe enough to keep would only
 * need to be wrong once.
 *
 * Nothing here is stored. §4 forbids storing a safety selection or any planned
 * action arising from one, and the way to honour that is to have nothing that
 * could: no action, no fetch, no state that outlives the page.
 */
export default function ChoiceList({
  choices,
  prompt,
}: {
  choices: Choice[];
  prompt?: string;
}) {
  const [chosen, setChosen] = useState<Choice | null>(null);

  if (chosen?.replaces) {
    return (
      <section className="mt-6 rounded-sm border border-[#8B3A2E] bg-[#FBF1EF] px-5 py-5">
        <h3
          className="text-xl text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {chosen.title}
        </h3>
        <p className="mt-3 leading-relaxed text-[#4A4038]">{chosen.body}</p>
        <p className="mt-3 leading-relaxed text-[#4A4038]">
          Do not raise this with the person using a worksheet from this course,
          and do not announce a decision to someone whose reaction you fear.
          Speak to a specialist service first — they can help you think about
          timing and safety in a way a checklist cannot.
        </p>
        <div className="mt-5">
          <Link
            href={bysySupportHref()}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
          >
            Finding Help Where You Live
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setChosen(null)}
          className="mt-5 text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Go back to the options
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
      {prompt && <p className="leading-relaxed">{prompt}</p>}

      <ul className="mt-5 space-y-3">
        {choices.map((choice) => {
          const selected = chosen?.id === choice.id;
          return (
            <li key={choice.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setChosen(selected ? null : choice)}
                className={`w-full rounded-sm border px-5 py-4 text-left transition-colors ${
                  selected
                    ? "border-[#8B5E34] bg-[#F3EADC]"
                    : "border-[#D9CDBA] hover:border-[#8B5E34]"
                }`}
              >
                <span className="block font-medium text-[#2B2118]">{choice.title}</span>
                {!selected && choice.body && (
                  <span className="mt-1 block text-sm leading-relaxed text-[#4A4038]">
                    {choice.body}
                  </span>
                )}
              </button>

              {selected && choice.caveat && (
                <div className="mt-2 rounded-sm border border-[#C9A227] bg-[#FBF6E9] px-5 py-4">
                  <h4 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                    Before anything else
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
                    {choice.caveat}
                  </p>
                  <p className="mt-3">
                    <Link
                      href={bysySupportHref()}
                      className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                    >
                      Finding Help Where You Live
                    </Link>
                  </p>
                </div>
              )}

              {selected && (
                <p className="mt-2 px-5 text-sm leading-relaxed text-[#4A4038]">
                  {choice.body}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {chosen && !chosen.replaces && (
        <p className="mt-5 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-3 text-sm leading-relaxed text-[#4A4038]">
          You chose: <strong className="font-medium text-[#2B2118]">{chosen.title}</strong>.{" "}
          <button
            type="button"
            onClick={() => setChosen(null)}
            className="underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Change this
          </button>
        </p>
      )}

      <p className="mt-5 text-sm leading-relaxed text-[#6B5F53]">
        {NOTHING_SCORES} Your selection is not saved — it is yours to act on,
        not a record for us to keep.
      </p>
    </section>
  );
}
