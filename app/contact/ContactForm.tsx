"use client";

import { useState } from "react";
import Link from "next/link";

import FinePrint, { FinePrintLink } from "@/components/FinePrint";

/**
 * The contact page's body. Split out from page.tsx only so the page itself can
 * be a Server Component and export metadata — a "use client" module cannot,
 * which is why /contact had no title, description or canonical of its own.
 */
export default function ContactForm() {
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
    "mt-2 w-full rounded-xl border border-line bg-cream px-4 py-3 text-navy outline-none focus:border-gold-text";
  // Ordinary sentence-case labels: easier to read than small capitals (website audit V22, 17 October 2026).
  const label = "block text-[15px] font-medium text-navy";

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Get in touch
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        For questions about the ministry, speaking, or anything else. If you
        want a private conversation about your own situation,{" "}
        <Link href="/talk-to-a-pastor" className="text-gold-text underline underline-offset-4">
          book a session
        </Link>{" "}
        instead, so I can give it proper time.
      </p>

      {status === "sent" ? (
        <div className="mt-12 rounded-xl border border-line bg-sand px-7 py-8">
          <p className="text-xl text-navy" style={{ fontFamily: "var(--font-display)" }}>
            Thank you. Your message has reached me.
          </p>
          <p className="mt-2 leading-relaxed">I read everything and reply as soon as I can.</p>
        </div>
      ) : (
        <div className="mt-12 space-y-6">
          <div>
            <label className={label} htmlFor="contact-name">
              Your name
            </label>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="contact-email">
              Your email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="contact-message">
              Your message
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={7}
              className={field}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          {status === "error" && (
            <p className="text-gold-text">
              Something went wrong. Please email info@faithfulpathcommunity.com directly.
            </p>
          )}

          <button
            onClick={submit}
            disabled={status === "sending"}
            className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Send message"}
          </button>

          <FinePrint className="mt-0">
            Your message is handled as described in our{" "}
            <FinePrintLink href="/privacy">Privacy Policy</FinePrintLink>.
          </FinePrint>
        </div>
      )}

      <p className="mt-14 border-t border-line pt-8 text-sm leading-relaxed text-muted">
        This inbox is not monitored around the clock and is not for
        emergencies. If you are in immediate danger, please contact your local
        emergency number or a crisis line in your country.
      </p>
    </main>
  );
}
