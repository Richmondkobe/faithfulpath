"use client";

import { useActionState, useState } from "react";
import {
  deleteArticle,
  type DeleteArticleState,
} from "@/app/admin/articles/actions";

const initial: DeleteArticleState = { error: null };

export default function DeleteArticle({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [state, action, pending] = useActionState(deleteArticle, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-16 max-w-2xl border-t border-line pt-10">
      <p
        className="text-lg text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Delete this article
      </p>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Removes it for good, and any links to it will start returning 404. This
        cannot be undone.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-danger-line px-6 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-sun"
        >
          Delete
        </button>
      ) : (
        <div className="mt-5 rounded-xl border border-danger-line bg-danger-bg px-6 py-5">
          <p className="text-sm leading-relaxed text-navy">
            Delete <span className="font-medium">{title}</span> for good?
          </p>
          <form action={action} className="mt-4 flex items-center gap-5">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-xl bg-danger px-6 py-3 text-sm font-medium text-sun transition-colors hover:bg-danger disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="text-sm text-muted transition-colors hover:text-gold-text disabled:opacity-60"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {state.error && (
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
