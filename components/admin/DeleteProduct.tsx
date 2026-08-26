"use client";

import { useActionState, useState } from "react";
import { deleteProduct, type DeleteState } from "@/app/admin/actions";

const initial: DeleteState = { error: null };

export default function DeleteProduct({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [state, action, pending] = useActionState(deleteProduct, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-16 max-w-2xl border-t border-[#E5D9C7] pt-10">
      <p
        className="text-lg text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Delete this guide
      </p>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#6B5F53]">
        Removes the guide and its cover and PDF from storage. This cannot be
        undone. Guides that have been bought cannot be deleted.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 inline-flex items-center justify-center rounded-sm border border-[#C8836F] px-6 py-3 text-sm font-medium text-[#8B3A2E] transition-colors hover:bg-[#8B3A2E] hover:text-[#FDFAF4]"
        >
          Delete
        </button>
      ) : (
        <div className="mt-5 rounded-sm border border-[#C8836F] bg-[#F7EDE6] px-6 py-5">
          <p className="text-sm leading-relaxed text-[#2B2118]">
            Delete <span className="font-medium">{title}</span> for good?
          </p>
          <form action={action} className="mt-4 flex items-center gap-5">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-sm bg-[#8B3A2E] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#6F2E24] disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="text-sm text-[#5C5147] transition-colors hover:text-[#8B5E34] disabled:opacity-60"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {state.error && (
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#8B3A2E]">
          {state.error}
        </p>
      )}
    </div>
  );
}
