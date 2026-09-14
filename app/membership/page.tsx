import type { Metadata } from "next";

const TITLE =
  "The Christian Spiritual Reset — Online Course | Faithful Path Community";
const DESCRIPTION =
  "The complete online edition of The Christian Spiritual Reset — a guided Christian retreat for people who are exhausted, spiritually dry, or unable to hear God.";

// A purpose-built 1200x630 card, like the ones the guides use. The course cover
// itself is portrait 2/3, which a social card would crop to a band and cut the
// title off — see the note above OG_IMAGES in app/guides/[slug]/page.tsx.
const OG_IMAGE = {
  url: "/og-membership.png",
  width: 1200,
  height: 630,
  alt: "The Christian Spiritual Reset — a guided online retreat with Pastor Richmond Kobe",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/membership" },
  // Page metadata replaces the root layout's openGraph/twitter objects wholesale
  // rather than merging into them, so siteName and the url have to be repeated.
  openGraph: {
    type: "website",
    url: "/membership",
    siteName: "Faithful Path Community",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
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

/** Both Join buttons post to the same existing Stripe checkout route. */
function JoinButton({ label }: { label: string }) {
  return (
    <form action="/api/membership/checkout" method="POST" className="mt-8">
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
      >
        {label}
      </button>
    </form>
  );
}

function Faq({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="leading-relaxed">
        <Bold>{question}</Bold>
      </p>
      <p className="mt-2 leading-relaxed">{children}</p>
    </div>
  );
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
        A guided spiritual reset with Pastor Richmond Kobe
      </h1>

      <p className="mt-6 text-lg leading-relaxed" style={lede}>
        The Faithful Path membership gives you the complete online edition of{" "}
        <em>The Christian Spiritual Reset</em>&mdash;a guided Christian retreat
        for people who feel exhausted, spiritually dry, emotionally overloaded,
        or unable to hear God clearly through the noise of ordinary life.
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

      <H2>Start your guided spiritual reset today</H2>
      <p className="mt-5 leading-relaxed">
        The complete course, ten guided retreat sessions, guided audio prayers in
        Pastor Richmond&rsquo;s voice, a personal online journal, and printable
        workbooks &mdash; available online, at your own pace.
      </p>
      <p className="mt-3 leading-relaxed">
        US$19 per month. Cancel from your account whenever you need to.
      </p>
      <JoinButton label="Join the membership" />

      <H2>What Your Membership Includes</H2>
      <ul className="mt-5 list-disc space-y-3 pl-6 leading-relaxed">
        <li>
          <Bold>Flexible retreat formats:</Bold> complete the personal retreat
          over three days, one day, three hours, or eight to twelve days at home.
          Additional guidance is included for couples, small groups, churches,
          pastors, and Christian leaders.
        </li>
        <li>
          <Bold>Ten guided retreat sessions:</Bold> follow seven core sessions in
          a carefully ordered journey, with three additional sessions for grief,
          forgiveness, and other deeper work when they are appropriate for you.
          Every session includes Scripture, teaching, guided audio prayer,
          silence, journaling, and a practical exercise.
        </li>
        <li>
          <Bold>Seventeen concise teaching lessons:</Bold> prepare carefully for
          the retreat and learn how to return well afterwards. The complete book
          chapters are also available alongside the shorter lessons for those who
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
          introductions and guided audio prayers from Pastor Richmond Kobe
          throughout the journey.
        </li>
        <li>
          <Bold>A 30-day renewal plan:</Bold> return to ordinary life gradually
          through four weeks of landing, acting, building a sustainable rhythm,
          and reviewing what has changed.
        </li>
      </ul>

      <H2>Why a membership, not a one-time course?</H2>
      <p className="mt-5 leading-relaxed">
        Because the Spiritual Reset is the first course here, not the only one.
      </p>
      <p className="mt-5 leading-relaxed">
        While your membership is active, it gives you:
      </p>
      <ul className="mt-3 list-disc space-y-3 pl-6 leading-relaxed">
        <li>
          <Bold>Every Faithful Path course.</Bold> The Christian Spiritual Reset
          is complete and open now. Four other Faithful Path guides are being
          built into courses in the same format and will be added to your
          membership as they are ready, at no extra cost:
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <em>Talk Before You Marry</em> &mdash; Christian premarital
              counselling
            </li>
            <li>
              <em>Lead Before You&rsquo;re Ready</em> &mdash; for new church
              leaders
            </li>
            <li>
              <em>Before You Say Yes</em> &mdash; discernment in Christian dating
            </li>
            <li>
              <em>When Your Mind Won&rsquo;t Rest</em> &mdash; a workbook on
              overthinking, worry and fear
            </li>
          </ul>
        </li>
        <li>
          <Bold>Written answers from a pastor.</Bold> Send Pastor Richmond one
          written question each month from inside your account. You will receive
          a personal reply within three working days. Your reply comes personally
          from Pastor Richmond; it is not automated or generated by a chatbot.
        </li>
        <li>
          <Bold>A journal that stays yours.</Bold> Everything you write in your
          course journal can be downloaded as a PDF at any time, and it remains
          readable in your account even if you cancel.
        </li>
        <li>
          <Bold>Every future course and member resource.</Bold> Every new course
          or resource added to the membership while you are a member is included
          at no extra cost.
        </li>
      </ul>
      <p className="mt-5 leading-relaxed">
        If you only want the Spiritual Reset, you may complete it during your
        first month and then cancel. Nothing is lost when you do.
      </p>

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
        <li>Believers who are tired in a place that sleep does not reach.</li>
        <li>Christians whose faith or prayer life has quietly become dry.</li>
        <li>
          Pastors and Christian leaders who have spent more time pouring out than
          receiving.
        </li>
        <li>Parents and caregivers who cannot leave home for three days.</li>
        <li>
          People carrying grief, responsibility, disappointment, or unanswered
          questions.
        </li>
        <li>
          Anyone who needs to stop without turning rest into another assignment.
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
          A three-day retreat&mdash;or a shorter format based on the time and
          emotional capacity you can realistically protect
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
        treatment, addiction treatment, trauma care, support services, or crisis
        support.
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

      <H2>What happens after you join</H2>
      <p className="mt-5 leading-relaxed">
        Join today and receive immediate access through your Faithful Path
        account. After payment you are signed in straight away; from then on, a
        six-digit code sent to your email opens your account on any device. There
        is no password to remember.
      </p>
      <p className="mt-3 leading-relaxed">
        Your journal entries are yours. You can download them as a PDF at any
        time, and after you cancel they remain readable in your account, though
        you will no longer be able to add to them. Your journal is private. It is
        not routinely read, monitored or reviewed by anyone at Faithful Path.
      </p>

      <H2>Questions people ask</H2>
      <div className="mt-5 space-y-6">
        <Faq question="Is this a live retreat or a self-paced course?">
          Self-paced. Everything is available the moment you join, and you take
          it in the time and format that fits your life. Pastor
          Richmond&rsquo;s teaching and guided prayers are recorded; his written
          answers to your questions are personal.
        </Faq>
        <Faq question="Is this a one-time course or a monthly membership?">
          A monthly membership. It gives you the Spiritual Reset now, every other
          course as it is added, and written answers from Pastor Richmond. If you
          only want the Spiritual Reset, complete it and cancel; you keep your
          journal.
        </Faq>
        <Faq question="Must I complete the full three-day format?">
          No. You may take the retreat over three hours, one day, three days, or
          eight to twelve days at home, and you can work through the material
          more gradually if that suits your circumstances. Your progress is
          saved, and you can pause and return whenever life allows.
        </Faq>
        <Faq question="Do I have to leave home?">
          No. Every format is designed to be taken where you are. The course
          helps you prepare a space, set a time, and tell the people around you
          what you are doing.
        </Faq>
        <Faq question="Is this suitable if I am dealing with burnout or depression?">
          The retreat was written for people who are tired in a way that ordinary
          rest has not resolved, and it approaches that experience carefully. But
          it is not a substitute for medical care, counselling, or crisis
          support. If you are in immediate danger or carrying more than ordinary
          tiredness, please speak with a doctor or a trusted person before
          undertaking an extended period of silence alone. The course says this
          plainly inside, and the course tells you when to stop.
        </Faq>
        <Faq question="Is counselling included?">
          The membership includes one written question to Pastor Richmond each
          month, answered personally. One-to-one pastoral sessions are a separate
          service; see Talk to a Pastor.
        </Faq>
        <Faq question="Can my spouse and I do it together?">
          Yes. Each person needs a separate membership so that both of you have
          your own private journal, saved progress and personal reflections. You
          can read and talk through the teaching together and keep the personal
          work private.
        </Faq>
        <Faq question="Are the workbook and Session Guide included?">
          Yes. Both are included as printable PDFs inside the course, along with
          the other printable resources.
        </Faq>
        <Faq question="How long do I keep access?">
          For as long as your membership is active. When you cancel, you keep
          access until the end of your current billing period.
        </Faq>
        <Faq question="What happens to my journal if I cancel?">
          It stays readable in your account, and you can download it as a PDF at
          any time, before or after cancelling.
        </Faq>
        <Faq question="How do I cancel?">
          From your account, in two clicks. You do not need to email anyone.
        </Faq>
        <Faq question="Is there a refund policy?">
          Yes. If you decide that the membership is not right for you, email
          info@faithfulpathcommunity.com within seven days of your first payment
          to request a full refund. Refunds do not apply to later monthly renewal
          payments, but you may cancel at any time to prevent the next payment.
        </Faq>
        <Faq question="How do I get help with the course or my account?">
          Email info@faithfulpathcommunity.com.
        </Faq>
      </div>

      <H2>Begin Your Spiritual Reset</H2>
      <p className="mt-5 leading-relaxed">
        You do not need to wait until you feel stronger, less busy, or more
        spiritually prepared. Begin with the time and capacity you have now.
      </p>
      <p className="mt-3 leading-relaxed">
        Your membership gives you immediate access to the complete course, guided
        retreat sessions, guided audio prayers, personal journal, printable
        resources, and the 30-day renewal journey.
      </p>
      <p className="mt-3 leading-relaxed">
        US$19 per month. Cancel from your account whenever you need to.
      </p>

      <JoinButton label="Join Faithful Path — US$19 per month" />

      <p className="mt-6 leading-relaxed">
        Start gently. Go deeper when you are ready.
      </p>

      <p className="mt-6 text-sm leading-relaxed text-[#6B5F53]">
        Cancel at any time from your account. You will be billed monthly, with no
        long-term commitment.
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
