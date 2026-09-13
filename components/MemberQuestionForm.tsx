"use client";

import { useActionState } from "react";
import {
  askMemberQuestion,
  type MemberQuestionState,
} from "@/app/members/actions";

const initial: MemberQuestionState = { error: null, sent: false };

/**
 * One written question a month. When the month's question is already used the
 * form is not rendered at all — the page says when the next one opens instead.
 */
export default function MemberQuestionForm() {
  const [state, action, pending] = useActionState(askMemberQuestion, initial);

  if (state.sent) {
    return (
      <p className="mt-6 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 leading-relaxed text-[#2B2118]">
        Your question was sent. Pastor Richmond replies personally within three
        working days.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6">
      <label htmlFor="question" className="sr-only">
        Your question
      </label>
      <textarea
        id="question"
        name="question"
        rows={6}
        required
        maxLength={4000}
        placeholder="Write your question here. Take as long as you need."
        className="w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm leading-relaxed text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
      />

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send my question"}
      </button>
    </form>
  );
}
