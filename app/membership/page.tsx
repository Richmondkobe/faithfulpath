import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership | Faithful Path Community",
  description:
    "The complete online edition of The Christian Spiritual Reset — a guided Christian retreat for people who feel exhausted, spiritually dry, or unable to hear God clearly.",
  alternates: { canonical: "/membership" },
};

const heading = { fontFamily: "var(--font-display)", fontWeight: 500 } as const;
const lede = { fontFamily: "var(--font-display)", fontWeight: 300 } as const;

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 text-2xl text-[#2B2118]" style={heading}>
      {children}
    </h2>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-[#2B2118]">{children}</strong>;
}

export default function Membership() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Membership
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        A guided spiritual reset led by Pastor Richmond Kobe
      </h1>

      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        The Faithful Path membership gives you the complete online edition of{" "}
        <em>The Christian Spiritual Reset</em>—a guided Christian retreat for
        people who feel exhausted, spiritually dry, emotionally overloaded, or
        unable to hear God clearly through the noise of ordinary life.
      </p>

      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        This is not simply a collection of lectures, and it is not another
        programme for becoming more disciplined.
      </p>

      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        It is a guided journey that helps you stop, become honest with God about
        what you are carrying, and return to ordinary life with something you can
        sustain.
      </p>

      <H2>What Your Membership Includes</H2>
      <ul className="mt-5 list-disc space-y-3 pl-6 leading-relaxed">
        <li>
          <Bold>Seven ready-to-use retreat formats:</Bold> complete the retreat
          over three days, one day, three hours, or eight to twelve days at home.
          Adapted formats are also included for couples, small groups, churches,
          pastors, and Christian leaders.
        </li>
        <li>
          <Bold>Ten guided retreat sessions:</Bold> seven form the core three-day
          journey, while three additional sessions can be completed when they are
          appropriate for you. Every session includes Scripture, teaching, guided
          prayer, silence, journaling, and a practical exercise.
        </li>
        <li>
          <Bold>Seventeen concise teaching lessons:</Bold> prepare carefully for
          the retreat and learn how to return well afterwards. The complete book
          chapters are also available beneath the shorter lessons for those who
          want to explore the teaching more deeply.
        </li>
        <li>
          <Bold>Personal readiness and safety checks:</Bold> unscored self-checks
          help you consider whether to proceed independently, arrange support,
          use an adapted format, or seek appropriate help before beginning.
        </li>
        <li>
          <Bold>A personal online journal:</Bold> keep your reflections,
          intentions, and retreat responses together in your account.
        </li>
        <li>
          <Bold>Printable retreat resources:</Bold> complete the worksheets,
          checklists, planning pages, testing tools, retreat cards, and
          rule-of-life template online or on paper.
        </li>
        <li>
          <Bold>Pastoral video and audio guidance:</Bold> receive video
          introductions and guided-prayer recordings from Pastor Richmond Kobe
          throughout the journey.
        </li>
        <li>
          <Bold>A 30-day renewal plan:</Bold> return to ordinary life gradually
          through four weeks of landing, acting, building a sustainable rhythm,
          and reviewing what has changed.
        </li>
      </ul>

      <H2>What This Course Is Designed to Help You Carry Home</H2>
      <p className="mt-5 leading-relaxed">
        <Bold>One burden entrusted to God.</Bold>
      </p>
      <p className="mt-3 leading-relaxed">
        <Bold>One responsible step to take.</Bold>
      </p>
      <p className="mt-3 leading-relaxed">
        <Bold>One person to involve.</Bold>
      </p>
      <p className="mt-3 leading-relaxed">
        <Bold>One sustainable rhythm to keep.</Bold>
      </p>
      <p className="mt-5 leading-relaxed">
        Everything in the course serves these four practical outcomes.
      </p>

      <H2>Who This Is For</H2>
      <p className="mt-5 leading-relaxed">This guided retreat is for:</p>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>Believers who are tired in a place that sleep does not reach</li>
        <li>Christians whose faith or prayer life has quietly become dry</li>
        <li>
          Pastors and Christian leaders who have spent more time pouring out than
          receiving
        </li>
        <li>Parents and caregivers who cannot leave home for three days</li>
        <li>
          People carrying grief, responsibility, disappointment, or unanswered
          questions
        </li>
        <li>
          Anyone who needs to stop without turning rest into another assignment
        </li>
      </ul>
      <p className="mt-5 leading-relaxed">
        You do not need to arrive strong, spiritually confident, or certain about
        what you need.
      </p>
      <p className="mt-3 leading-relaxed">You only need to come honestly.</p>

      <H2>How Much Time You Will Need</H2>
      <p className="mt-5 leading-relaxed">The complete pathway includes:</p>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>A few hours of preparation, spread over one or two weeks</li>
        <li>
          A three-day retreat—or a shorter format based on the time and capacity
          you can protect
        </li>
        <li>Thirty days of gentle follow-through, ending with an honest review</li>
      </ul>
      <p className="mt-5 leading-relaxed">
        If you are already exhausted and cannot complete all the preparation
        first, the Quick Start route helps you begin with the essential safety and
        practical guidance before taking a three-hour or one-day reset.
      </p>
      <p className="mt-3 leading-relaxed">
        You can begin gently and go deeper later.
      </p>

      <H2>What This Retreat Is Not</H2>
      <p className="mt-5 leading-relaxed">
        This retreat is not a substitute for medical care, psychological
        treatment, addiction treatment, trauma care, safeguarding assistance, or
        crisis support.
      </p>
      <p className="mt-3 leading-relaxed">
        The course says this plainly and includes personal readiness and safety
        checks before the retreat begins. These checks are not clinical
        assessments, are not monitored in real time, and do not contact anyone
        automatically.
      </p>
      <p className="mt-3 leading-relaxed">
        If your answers indicate that you may need additional support, the course
        will direct you to the <Bold>Finding Help Where You Live</Bold> page and
        explain the appropriate next step.
      </p>
      <p className="mt-3 leading-relaxed">
        Seeking help is not a failure of faith. It is an act of wisdom.
      </p>

      <H2>Begin Your Spiritual Reset</H2>
      <p className="mt-5 leading-relaxed">
        Receive the complete course, guided retreat, audio prayers, personal
        journal, printable resources, and 30-day renewal journey.
      </p>

      <form action="/api/membership/checkout" method="POST" className="mt-8">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Join Faithful Path—US$19 per month
        </button>
      </form>

      <p className="mt-6 text-sm leading-relaxed text-[#6B5F53]">
        Cancel at any time from your account. You will be billed monthly, with no
        long-term commitment.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#6B5F53]">
        Your journal and course progress remain available in your account while
        your membership is active.
      </p>

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <p className="text-sm leading-relaxed text-[#6B5F53]">
          Already a member?{" "}
          <a
            href="/members/login"
            className="font-medium text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Sign in using the email connected to your membership
          </a>
        </p>
      </div>
    </main>
  );
}
