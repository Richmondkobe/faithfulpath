"use client";

import { useActionState, useRef, useState } from "react";
import { postPrayerRequest, type PrayerPostState } from "@/app/community/actions";
import { PRAYER_MAX } from "@/lib/community";
import { buttonClass, errorClass, inputClass, labelClass, okClass } from "@/components/community/styles";

const initial: PrayerPostState = { error: null, posted: false };

export default function PrayerPostForm({ firstName }: { firstName: string }) {
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, posting] = useActionState(async (prev: PrayerPostState, data: FormData) => {
    const next = await postPrayerRequest(prev, data);
    if (next.posted) {
      formRef.current?.reset();
      setLength(0);
    }
    return next;
  }, initial);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <label htmlFor="body" className={labelClass}>
          Your prayer request
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          maxLength={PRAYER_MAX}
          onChange={(e) => setLength(e.target.value.length)}
          aria-describedby="body-count"
          className={`${inputClass} leading-relaxed`}
        />
        <p id="body-count" className="mt-1 text-right text-[13px] text-muted">
          {length.toLocaleString("en-GB")} / {PRAYER_MAX.toLocaleString("en-GB")}
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
      {state.posted && (
        <p role="status" className={okClass}>
          Thank you. Your request is waiting for Pastor Richmond to read it, and will appear on the wall once he has.
        </p>
      )}

      <button type="submit" disabled={posting} className={buttonClass}>
        {posting ? "Sharing…" : "Share my request"}
      </button>
    </form>
  );
}
