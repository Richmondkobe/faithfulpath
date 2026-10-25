"use client";

import { useActionState } from "react";
import { saveCommunityProfile, type ProfileState } from "@/app/community/actions";
import DetailsFields from "@/components/community/DetailsFields";
import { buttonClass, errorClass, okClass } from "@/components/community/styles";

const initial: ProfileState = { error: null, saved: false };

/**
 * On the community home: joining, for someone signed in without a profile
 * (all the joining details, the message included), or changing name, country
 * and phone afterwards.
 */
export default function ProfileForm({
  fullName,
  country,
  phone = "",
  joining,
  submitLabel,
}: {
  fullName: string;
  country: string;
  phone?: string;
  /** Not joined yet, so the message is asked for too. */
  joining: boolean;
  submitLabel: string;
}) {
  const [state, action, saving] = useActionState(saveCommunityProfile, initial);
  return (
    <form action={action} className="mt-5 max-w-md space-y-4">
      <DetailsFields fullName={fullName} country={country} phone={phone} withMessage={joining} />
      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className={okClass}>
          Saved.
        </p>
      )}
      <button type="submit" disabled={saving} className={buttonClass}>
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
