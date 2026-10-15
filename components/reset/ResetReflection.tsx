"use client";

import { useState, useTransition } from "react";

import { saveResetAnswer } from "@/app/members/courses/christian-spiritual-reset/actions";

/**
 * The optional written answer a page offers under "Think".
 *
 * Optional means optional. It opens closed, so a page is not a form somebody
 * has to get past; nothing is required to finish the lesson, and the
 * completion checkbox stores none of what is written here.
 *
 * The saving is deliberately dull — a button, and a line saying it saved.
 * Autosaving prose somebody is still deciding whether to write is a way of
 * taking the decision off them.
 */
export default function ResetReflection({
  pageSlug,
  index,
  label,
  saved,
}: {
  pageSlug: string;
  index: number;
  label: string;
  saved: string;
}) {
  const [open, setOpen] = useState(Boolean(saved));
  const [text, setText] = useState(saved);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await saveResetAnswer(pageSlug, index, text);
        setState("saved");
      } catch {
        setState("error");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-5 py-3 text-sm text-gold-text transition-colors hover:border-gold-text hover:text-navy"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="mt-4">
      <label className="block text-sm text-muted">{label}</label>
      <textarea
        value={text}
        rows={5}
        onChange={(e) => {
          setText(e.target.value);
          setState("idle");
        }}
        className="mt-2 w-full rounded-xl border border-field bg-white px-4 py-3 text-[15px] leading-relaxed text-navy focus:border-gold-text focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl border-[1.5px] border-navy bg-white px-4 py-2 text-sm text-navy transition-colors hover:border-gold-text"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state === "saved" && (
          <span className="text-sm text-muted">Saved. Only you can read this.</span>
        )}
        {state === "error" && (
          <span role="alert" className="text-sm text-danger">
            That did not save. Your words are still here on the page.
          </span>
        )}
      </div>
    </div>
  );
}
