"use client";

import { useId, useState } from "react";
import { track } from "@vercel/analytics";

import FinePrint, { FinePrintLink } from "@/components/FinePrint";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const nameId = useId();
  const emailId = useId();

  async function handleSubmit() {
    if (status === "loading") return;

    if (!name.trim()) {
      setStatus("error");
      setMessage("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();

      if (res.ok) {
        // The event carries no properties at all: the only thing this form
        // collects is a name and an email address, and neither belongs here.
        track("newsletter_subscribe");
        setStatus("done");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm leading-relaxed text-[#6B5F53]">
        Thank you &mdash; you&apos;re on the list. Look out for the first one
        soon.
      </p>
    );
  }

  const inputClass =
    "w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#7A7066] focus:border-[#8B5E34]";

  return (
    <div>
      <p
        className="text-lg text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        A short letter, now and then
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6B5F53]">
        Scripture, and something honest about walking with God. No noise.
      </p>

      {/* A real form, so Enter and the browser's autofill behave as people
          expect; the checks above still run, in place of the browser's own. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mt-4 max-w-md space-y-2"
      >
        {/* Labels a screen reader announces; the placeholder vanishes as
            soon as someone types. */}
        <label htmlFor={nameId} className="sr-only">
          Your full name
        </label>
        <input
          id={nameId}
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
          className={inputClass}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={inputClass + " flex-1"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
          >
            {status === "loading" ? "Adding\u2026" : "Subscribe"}
          </button>
        </div>

        {/* Under the field, not above it: it answers the question a reader has
            once they are looking at the box, which is what happens to the
            address they are about to type. */}
        <FinePrint className="mt-3">
          No spam. Unsubscribe any time. See our{" "}
          <FinePrintLink href="/privacy">Privacy Policy</FinePrintLink>.
        </FinePrint>
      </form>

      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-[#8B3A2E]">{message}</p>
      )}
    </div>
  );
}
