"use client";

import { useState, type ReactNode } from "react";
import { COUNTRY_MAX, FULL_NAME_MAX, JOIN_MESSAGE_LABEL, JOIN_MESSAGE_MAX, PHONE_MAX } from "@/lib/community";
import { inputClass, labelClass } from "@/components/community/styles";

/**
 * The details asked on joining: full name, country, an optional phone and a
 * required message for Richmond. Shared by the join form and the community
 * home's profile form. `withMessage` is false once someone has joined: the
 * message is theirs to write once.
 */
export default function DetailsFields({
  fullName = "",
  country = "",
  phone = "",
  message = "",
  withMessage,
  emailField,
}: {
  fullName?: string;
  country?: string;
  phone?: string;
  message?: string;
  withMessage: boolean;
  /** The join form's email box, which goes straight after the name. */
  emailField?: ReactNode;
}) {
  const [length, setLength] = useState(message.length);
  return (
    <>
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
      {emailField}
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
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone <span className="normal-case tracking-normal text-muted">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={PHONE_MAX}
          defaultValue={phone}
          aria-describedby="phone-note"
          className={inputClass}
        />
        <p id="phone-note" className="mt-1 text-[13px] text-muted">
          Only Pastor Richmond sees it. Other members never do.
        </p>
      </div>
      {withMessage && (
        <div>
          <label htmlFor="join_message" className="block text-[15px] font-semibold leading-snug text-gold-text">
            {JOIN_MESSAGE_LABEL}
          </label>
          <textarea
            id="join_message"
            name="join_message"
            required
            rows={5}
            maxLength={JOIN_MESSAGE_MAX}
            defaultValue={message}
            onChange={(e) => setLength(e.target.value.length)}
            aria-describedby="join-message-note"
            className={`${inputClass} leading-relaxed`}
          />
          <p id="join-message-note" className="mt-1 flex justify-between gap-3 text-[13px] text-muted">
            <span>Pastor Richmond reads every one himself. Other members do not see it.</span>
            <span className="shrink-0">
              {length} / {JOIN_MESSAGE_MAX}
            </span>
          </p>
        </div>
      )}
    </>
  );
}
