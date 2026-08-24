"use client";

import { useState } from "react";
import Link from "next/link";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function submit() {
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/xyegqykq", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "mt-2 w-full rounded-sm border border-[#E5D9C7] bg-[#FDFAF4] px-4 py-3 text-[#2B2118] outline-none focus:border-[#8B5E34]";
  const label = "block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]";

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Get in touch
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        For questions about the ministry, speaking, or anything else. If you
        want a private conversation about your own situation,{" "}
        <Link href="/talk-to-a-pastor" className="text-[#8B5E34] underline underline-offset-4">
          book a session
        </Link>{" "}
        instead, so I can give it proper time.
      </p>

      {status === "sent" ? (
        <div className="mt-12 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-8">
          <p className="text-xl text-[#2B2118]" style={{ fontFamily: "var(--font-display)" }}>
            Thank you. Your message has reached me.
          </p>
          <p className="mt-2 leading-relaxed">I read everything and reply as soon as I can.</p>
        </div>
      ) : (
        <div className="mt-12 space-y-6">
          <div>
            <label className={label}>Your name</label>
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Your email</label>
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Your message</label>
            <textarea
              rows={7}
              className={field}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          {status === "error" && (
            <p className="text-[#8B5E34]">
              Something went wrong. Please email info@faithfulpathcommunity.com directly.
            </p>
          )}

          <button
            onClick={submit}
            disabled={status === "sending"}
            className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </div>
      )}

      <p className="mt-14 border-t border-[#E5D9C7] pt-8 text-sm leading-relaxed text-[#6B5F53]">
        This inbox is not monitored around the clock and is not for
        emergencies. If you are in immediate danger, please contact your local
        emergency number or a crisis line in your country.
      </p>
    </main>
  );
}
