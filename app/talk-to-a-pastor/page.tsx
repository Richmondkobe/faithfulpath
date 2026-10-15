import type { Metadata } from "next";
import { socialMeta } from "@/lib/social-meta";

import FinePrint, { FinePrintLink } from "@/components/FinePrint";
import { TrackedAnchor } from "@/components/analytics/Tracked";
import JsonLd from "@/components/JsonLd";
import { abs, graph, orgRef } from "@/lib/schema";
import Link from "next/link";
import { display, sans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Talk to a Pastor — Online Pastoral Counselling (US$60)",
  description:
    "One hour online with a pastor of twenty years. Written intake, a live conversation, and a written follow-up within 24 hours. US$60.",
  alternates: { canonical: "/talk-to-a-pastor" },
  ...socialMeta({
    title: "Talk to a Pastor — Online Pastoral Counselling",
    description:
      "One hour online with a pastor of twenty years. Written intake, a live conversation, and a written follow-up within 24 hours. US$60.",
    path: "/talk-to-a-pastor",
  }),
};

const COUNTRIES = [
  "Canada",
  "United States",
  "Ghana",
  "Philippines",
  "Thailand",
  "Kenya",
  "Rwanda",
  "Uganda",
  "Nigeria",
  "Singapore",
];

const SITUATIONS = [
  "We're getting married, and everyone keeps telling us we should talk to someone first.",
  "Something happened, and I haven't been able to pray since.",
  "I lost someone. The answers people give me at church aren't reaching me.",
  "My marriage has gone quiet in a way that frightens me.",
  "I'm the one everybody comes to. I don't have anyone.",
  "I'm not sure I believe any of it, but I need to talk to someone who does.",
];

const STAGES = [
  {
    label: "Before",
    title: "You write to me",
    body:
      "You answer a few questions in writing — where you are, what happened, what you're carrying, what you want God to do. Take as long as you need. I read it and pray over it before we ever meet.",
  },
  {
    label: "The hour",
    title: "We talk",
    body:
      "Sixty minutes, face to face over video. Mostly I listen. I'll ask questions, and where scripture speaks to what you're facing, I'll bring it — plainly, not as a lecture.",
  },
  {
    label: "After",
    title: "I write back",
    body:
      "Within 24 hours you get a written follow-up: what I heard, passages to sit with, and two or three concrete next steps. Something to return to when the conversation has faded.",
  },
];

const SERVICE_SCHEMA = graph({
  "@type": "Service",
  name: "Talk to a Pastor",
  serviceType: "Pastoral counselling",
  url: abs("/talk-to-a-pastor"),
  provider: orgRef,
  areaServed: "Worldwide",
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: abs("/talk-to-a-pastor"),
    availableLanguage: "en",
  },
  offers: {
    "@type": "Offer",
    price: "60.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: abs("/talk-to-a-pastor"),
    seller: orgRef,
  },
});

export default function Home() {
  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-cream text-ink`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <JsonLd data={SERVICE_SCHEMA} />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold-text font-medium">
          Faithful Path Community
        </p>

        <h1
          className="mt-8 text-[2.75rem] leading-[1.05] tracking-[-0.02em] text-navy sm:text-[4.25rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Talk to a pastor.
        </h1>

        <p
          className="mt-6 max-w-xl text-lg leading-relaxed text-ink sm:text-xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Online Christian counselling and spiritual guidance — one honest hour
          with someone who has been doing this for twenty years.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <TrackedAnchor
            event="book_session_click"
            href="https://cal.com/getclb/talk-to-a-pastor"
            className="inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-text"
          >
            Book a conversation — US$60
          </TrackedAnchor>
          <p className="text-sm text-muted">
            One 60-minute session. No church membership required.
          </p>
        </div>

        {/* What the hour is, before anyone books it. Above the rescheduling
            line because the scope of the session matters more than its
            cancellation policy to somebody deciding whether this is the right
            kind of help at all. */}
        <FinePrint className="mt-4">
          Pastoral support from an ordained minister — not psychotherapy,
          medical treatment or an emergency service.
        </FinePrint>

        <FinePrint className="mt-2">
          Reschedule or cancel free up to 24 hours before ·{" "}
          <FinePrintLink href="/pastoral-terms">
            Read the Pastoral Conversation Terms
          </FinePrintLink>
        </FinePrint>
      </section>

      {/* Credential band */}
      <section className="border-y border-line bg-sand">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {[
              ["20", "years pastoring"],
              ["10", "countries"],
              ["1,000+", "people counselled"],
              ["18", "books written"],
            ].map(([figure, label]) => (
              <div key={label}>
                <dt
                  className="text-3xl text-navy sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  {figure}
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-muted">
                  {label}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-muted font-medium">
            {COUNTRIES.join(" · ")}
          </p>
        </div>
      </section>

      {/* What the conversation is */}
      <section className="mx-auto max-w-3xl px-6 py-14 sm:py-28">
        <h2
          className="text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          What you get for US$60
        </h2>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {STAGES.map((stage) => (
            <div key={stage.label} className="grid gap-2 py-6 sm:grid-cols-[5rem_1fr] sm:gap-6">
              <p className="pt-1 text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
                {stage.label}
              </p>
              <div>
                <h3
                  className="text-xl text-navy"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {stage.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink">{stage.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who comes */}
      <section className="bg-navy py-20 text-sand sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className="text-3xl tracking-[-0.01em] text-sun sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            People come to me saying things like this
          </h2>

          <ul className="mt-12 space-y-7">
            {SITUATIONS.map((line) => (
              <li
                key={line}
                className="border-l-2 border-gold-text pl-5 text-lg leading-relaxed sm:text-xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic" }}
              >
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-12 max-w-xl leading-relaxed text-line">
            You don&rsquo;t have to arrive with the right words, or with faith intact.
            You only have to be willing to say the true thing out loud once.
          </p>
        </div>
      </section>

      {/* Who I am */}
      <section className="mx-auto max-w-3xl px-6 py-14 sm:py-28">
        <h2
          className="text-3xl tracking-[-0.01em] text-navy sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Who you&rsquo;d be talking to
        </h2>

        <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed">
          <p>
            My name is Richmond. I hold a degree in theology and I have pastored
            for more than twenty years — in Canada and the United States, across
            West and East Africa, and through Southeast Asia.
          </p>
          <p>
            In that time I&rsquo;ve counselled well over a thousand individuals and
            couples: engaged couples preparing to marry, families coming apart,
            people carrying grief they can&rsquo;t put down, and pastors quietly
            running on empty.
          </p>
          <p>
            I&rsquo;ve written eighteen books on spiritual growth and personal
            development. But the work I care most about has always happened in a
            room with one person, telling the truth.
          </p>
        </div>
      </section>

      {/* What this isn't */}
      <section className="border-y border-line bg-sand">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
            Please read this first
          </h2>
          <div className="mt-6 max-w-xl space-y-4 leading-relaxed text-ink">
            <p>
              This is pastoral and spiritual guidance from an ordained minister.
              It is not licensed therapy, psychiatric treatment, or medical care,
              and it does not replace them. Where you need a clinician, I&rsquo;ll say
              so and help you think about finding one.
            </p>
            <p>
              Sessions are scheduled in advance. This is not an emergency
              service.{" "}
              <strong className="font-semibold text-navy">
                If you are in immediate danger, or thinking of harming yourself,
                please contact your local emergency number or a crisis line in
                your country right now.
              </strong>
            </p>
            <p>
              What you write and say is treated as private. The only exceptions
              are where someone is at risk of serious harm, or where the law
              requires disclosure. Your written intake is stored — I read it
              before we meet, and I return to it when I write back to you.
            </p>
            <p>
              Intake notes and session notes are deleted twelve months after we
              speak, and sooner{" "}
              <Link
                href="/contact"
                className="text-gold-text underline underline-offset-4"
              >
                if you ask me to
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-3xl px-6 py-14 text-center sm:py-28">
        <p
          className="mx-auto max-w-lg text-2xl leading-snug text-navy sm:text-3xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          One honest hour can help you name what is happening and identify a responsible next step.
        </p>
        <TrackedAnchor
          event="book_session_click"
          href="https://cal.com/getclb/talk-to-a-pastor"
          className="mt-10 inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-text"
        >
          Book a conversation — US$60
        </TrackedAnchor>

        <FinePrint className="mt-4">
          Reschedule or cancel free up to 24 hours before ·{" "}
          <FinePrintLink href="/pastoral-terms">
            Read the Pastoral Conversation Terms
          </FinePrintLink>
        </FinePrint>
      </section>

      <footer className="border-t border-line py-10">
        <p className="mx-auto max-w-3xl px-6 text-[13px] text-muted">
          Faithful Path Community
        </p>
      </footer>
    </main>
  );
}
