"use client";

import { useState } from "react";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("done");
        setEmail("");
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
        Thank you — you&apos;re on the list. Look out for the first one soon.
      </p>
    );
  }

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

      <div className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="your@email.com"
          className="flex-1 rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {status === "loading" ? "Adding…" : "Subscribe"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-2 text-sm text-[#8B3A2E]">{message}</p>
      )}
    </div>
  );
}
