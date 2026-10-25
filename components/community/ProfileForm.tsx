"use client";

import { useActionState } from "react";
import { saveCommunityProfile, type ProfileState } from "@/app/community/actions";
import { COUNTRY_MAX, FULL_NAME_MAX } from "@/lib/community";
import { buttonClass, errorClass, inputClass, labelClass, okClass } from "@/components/community/styles";

const initial: ProfileState = { error: null, saved: false };

/** Full name and country: asked once on joining, and editable afterwards. */
export default function ProfileForm({
  fullName,
  country,
  submitLabel,
}: {
  fullName: string;
  country: string;
  submitLabel: string;
}) {
  const [state, action, saving] = useActionState(saveCommunityProfile, initial);
  return (
    <form action={action} className="mt-5 max-w-md space-y-4">
      <div>
        <label htmlFor="full_name" className={labelClass}>
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          maxLength={FULL_NAME_MAX}
          defaultValue={fullName}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="country" className={labelClass}>
          Country you live in
        </label>
        <input
          id="country"
          name="country"
          type="text"
          required
          autoComplete="country-name"
          maxLength={COUNTRY_MAX}
          defaultValue={country}
          className={inputClass}
        />
      </div>
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
