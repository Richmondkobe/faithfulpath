"use client";

import { useActionState, useRef, useState } from "react";
import { askQuestion, type QuestionState } from "@/app/community/actions";
import { QUESTION_MAX } from "@/lib/community";
import { buttonClass, errorClass, inputClass, labelClass, okClass } from "@/components/community/styles";

const initial: QuestionState = { error: null, asked: false };

export default function QuestionForm({ firstName }: { firstName: string }) {
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, asking] = useActionState(async (prev: QuestionState, data: FormData) => {
    const next = await askQuestion(prev, data);
    if (next.asked) {
      formRef.current?.reset();
      setLength(0);
    }
    return next;
  }, initial);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <label htmlFor="question" className={labelClass}>
          Your question
        </label>
        <textarea
          id="question"
          name="body"
          required
          rows={5}
          maxLength={QUESTION_MAX}
          onChange={(e) => setLength(e.target.value.length)}
          aria-describedby="question-count"
          className={`${inputClass} leading-relaxed`}
        />
        <p id="question-count" className="mt-1 text-right text-[13px] text-muted">
          {length.toLocaleString("en-GB")} / {QUESTION_MAX.toLocaleString("en-GB")}
        </p>
      </div>
      <fieldset>
        <legend className={labelClass}>Show it as</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          <label className="flex min-h-11 items-center gap-2 text-navy">
            <input type="radio" name="show_name" value="name" defaultChecked className="h-5 w-5 accent-[#a97a29]" />
            {firstName}
          </label>
          <label className="flex min-h-11 items-center gap-2 text-navy">
            <input type="radio" name="show_name" value="anonymous" className="h-5 w-5 accent-[#a97a29]" />
            Anonymous
          </label>
        </div>
      </fieldset>
      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      {state.asked && (
        <p role="status" className={okClass}>
          Thank you. Pastor Richmond will read your question. When he answers it, it appears here and you get an email.
        </p>
      )}
      <button type="submit" disabled={asking} className={buttonClass}>
        {asking ? "Sending…" : "Ask my question"}
      </button>
    </form>
  );
}
