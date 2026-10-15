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
      <p className="mt-6 rounded-xl border border-line bg-sand px-5 py-4 leading-relaxed text-navy">
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
        className="w-full rounded-xl border border-field bg-white px-4 py-3 text-sm leading-relaxed text-navy outline-none placeholder:text-placeholder focus:border-gold-text"
      />

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send my question"}
      </button>
    </form>
  );
}
