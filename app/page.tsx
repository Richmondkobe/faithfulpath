import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Talk to a Pastor — Online Christian Counselling | Faithful Path Community",
  description:
    "One hour online with a pastor of twenty years. Written intake, a live conversation, and a written follow-up within 24 hours. US$60.",
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

export default function Home() {
  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#FCFCFB] text-[#3E4E58]`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#2C5651]">
          Faithful Path Community
        </p>

        <h1
          className="mt-8 text-[2.75rem] leading-[1.05] tracking-[-0.02em] text-[#17222B] sm:text-[4.25rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Talk to a pastor.
        </h1>

        <p
          className="mt-6 max-w-xl text-lg leading-relaxed text-[#3E4E58] sm:text-xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          Online Christian counselling and spiritual guidance — one honest hour
          with someone who has been doing this for twenty years.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href="/book"
            className="inline-flex items-center justify-center rounded-sm bg-[#17222B] px-8 py-4 text-[15px] font-medium text-[#FCFCFB] transition-colors hover:bg-[#2C5651] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5651]"
          >
            Book a conversation — US$60
          </a>
          <p className="text-sm text-[#6B7A83]">
            One 60-minute session. No church membership required.
          </p>
        </div>
      </section>

      {/* Credential band */}
      <section className="border-y border-[#D6DBD8] bg-[#EEF1EF]">
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
                  className="text-3xl text-[#17222B] sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  {figure}
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-[#5A6A73]">
                  {label}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#6B7A83]">
            {COUNTRIES.join(" · ")}
          </p>
        </div>
      </section>

      {/* What the conversation is */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <h2
          className="text-3xl tracking-[-0.01em] text-[#17222B] sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          What you get for US$60
        </h2>

        <div className="mt-12 divide-y divide-[#D6DBD8] border-y border-[#D6DBD8]">
          {STAGES.map((stage) => (
            <div key={stage.label} className="grid gap-3 py-8 sm:grid-cols-[8rem_1fr] sm:gap-8">
              <p className="pt-1 text-[11px] uppercase tracking-[0.18em] text-[#2C5651]">
                {stage.label}
              </p>
              <div>
                <h3
                  className="text-xl text-[#17222B]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {stage.title}
                </h3>
                <p className="mt-2 leading-relaxed text-[#3E4E58]">{stage.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who comes */}
      <section className="bg-[#17222B] py-20 text-[#DCE3E2] sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className="text-3xl tracking-[-0.01em] text-[#FCFCFB] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            People come to me saying things like this
          </h2>

          <ul className="mt-12 space-y-7">
            {SITUATIONS.map((line) => (
              <li
                key={line}
                className="border-l-2 border-[#2C5651] pl-5 text-lg leading-relaxed sm:text-xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic" }}
              >
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-12 max-w-xl leading-relaxed text-[#9DAFB0]">
            You don't have to arrive with the right words, or with faith intact.
            You only have to be willing to say the true thing out loud once.
          </p>
        </div>
      </section>

      {/* Who I am */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <h2
          className="text-3xl tracking-[-0.01em] text-[#17222B] sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Who you'd be talking to
        </h2>

        <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed">
          <p>
            My name is Richmond. I hold a degree in theology and I have pastored
            for more than twenty years — in Canada and the United States, across
            West and East Africa, and through Southeast Asia.
          </p>
          <p>
            In that time I've counselled well over a thousand individuals and
            couples: engaged couples preparing to marry, families coming apart,
            people carrying grief they can't put down, and pastors quietly
            running on empty.
          </p>
          <p>
            I've written eighteen books on spiritual growth and personal
            development. But the work I care most about has always happened in a
            room with one person, telling the truth.
          </p>
        </div>
      </section>

      {/* What this isn't */}
      <section className="border-y border-[#D6DBD8] bg-[#EEF1EF]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#2C5651]">
            Please read this first
          </h2>
          <div className="mt-6 max-w-xl space-y-4 leading-relaxed text-[#3E4E58]">
            <p>
              This is pastoral and spiritual guidance from an ordained minister.
              It is not licensed therapy, psychiatric treatment, or medical care,
              and it does not replace them. Where you need a clinician, I'll say
              so and help you think about finding one.
            </p>
            <p>
              Sessions are scheduled in advance. This is not an emergency
              service.{" "}
              <strong className="font-semibold text-[#17222B]">
                If you are in immediate danger, or thinking of harming yourself,
                please contact your local emergency number or a crisis line in
                your country right now.
              </strong>
            </p>
            <p>
              Everything you write and say stays between us.
            </p>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <p
          className="mx-auto max-w-lg text-2xl leading-snug text-[#17222B] sm:text-3xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          One hour is usually enough to stop going in circles.
        </p>
        <a
          href="/book"
          className="mt-10 inline-flex items-center justify-center rounded-sm bg-[#17222B] px-8 py-4 text-[15px] font-medium text-[#FCFCFB] transition-colors hover:bg-[#2C5651] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5651]"
        >
          Book a conversation — US$60
        </a>
      </section>

      <footer className="border-t border-[#D6DBD8] py-10">
        <p className="mx-auto max-w-3xl px-6 text-[13px] text-[#6B7A83]">
          Faithful Path Community
        </p>
      </footer>
    </main>
  );
}
