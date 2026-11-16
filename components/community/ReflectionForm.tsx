"use client";

import { useActionState, useRef, useState } from "react";
import { shareReflection, type ReflectionState } from "@/app/community/actions";
import { REFLECTION_MAX } from "@/lib/devotional-shared";
import { buttonClass, errorClass, inputClass, labelClass, okClass } from "@/components/community/styles";

const initial: ReflectionState = { error: null, shared: false };

/** The box under the day's devotion. `direct` is Pastor Richmond: his own go straight up. */
export default function ReflectionForm({ firstName, direct }: { firstName: string; direct: boolean }) {
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, sharing] = useActionState(async (prev: ReflectionState, data: FormData) => {
    const next = await shareReflection(prev, data);
    if (next.shared) {
      formRef.current?.reset();
      setLength(0);
    }
    return next;
  }, initial);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label htmlFor="reflection" className={labelClass}>
          Share your reflection
        </label>
        <textarea
          id="reflection"
          name="body"
          required
          rows={3}
          maxLength={REFLECTION_MAX}
          onChange={(e) => setLength(e.target.value.length)}
          aria-describedby="reflection-count"
          className={`${inputClass} leading-relaxed`}
        />
        <p id="reflection-count" className="mt-1 flex flex-wrap justify-between gap-2 text-[13px] text-muted">
          <span>Shown as {firstName}.</span>
          <span>
            {length.toLocaleString("en-GB")} / {REFLECTION_MAX.toLocaleString("en-GB")}
          </span>
        </p>
      </div>

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      {state.shared && (
        <p role="status" className={okClass}>
          {direct
            ? "Shared. It is under today’s devotion."
            : "Thank you. Your reflection is waiting for Pastor Richmond to read it, and will appear here once he has."}
        </p>
      )}

      <button type="submit" disabled={sharing} className={buttonClass}>
        {sharing ? "Sharing…" : "Share my reflection"}
      </button>
    </form>
  );
}
