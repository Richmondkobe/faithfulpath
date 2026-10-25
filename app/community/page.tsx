import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import richmond from "@/public/richmond-kobe-portrait.webp";
import EntryButton from "@/components/community/EntryButton";
import { DISPLAY } from "@/components/community/styles";
import { socialMeta } from "@/lib/social-meta";
import { HELP_PATH } from "@/lib/site";

const TITLE = "The Faithful Path Community";
const DESCRIPTION =
  "A free community led by Pastor Richmond Kobe: a place to grow, pray and walk with others. Share prayer requests and join the weekly online gathering.";

export const metadata: Metadata = {
  title: "Community",
  description: DESCRIPTION,
  alternates: { canonical: "/community" },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: "/community" }),
};

const GETS = [
  {
    title: "The Prayer Wall",
    text: "Share a prayer request, with your first name or anonymously, and pray for others. Pastor Richmond reads every request before it appears, and you can mark yours answered when God answers.",
  },
  {
    title: "The Weekly Gathering",
    text: "An online gathering on Zoom each week, to pray and open the Bible together. The time is shown in your own time zone, with a button to add it to your calendar.",
  },
  {
    title: "Free, with no card",
    text: "Joining costs nothing and needs only your name, your country and your email. There is no password: we email you a 6-digit code to sign in.",
  },
];

/** The statement of faith: each belief's opening words in bold, then the rest. */
const BELIEFS: [string, string][] = [
  ["The Bible", " is the inspired Word of God, true and our final authority for faith and life."],
  ["There is one God,", " eternally existing as Father, Son and Holy Spirit."],
  [
    "Jesus Christ",
    " is fully God and fully man. He was born of a virgin, lived without sin, died on the cross for our sins, rose bodily from the dead, and will return.",
  ],
  ["Salvation", " is a gift of God's grace, received through faith in Jesus Christ alone, not by our own works."],
  [
    "The Holy Spirit",
    " lives in every believer, giving new life, power for holy living, and gifts to serve the church.",
  ],
  [
    "The Church",
    " is the family of believers, called to worship together, care for one another, and make disciples of all nations.",
  ],
  ["Every believer", " is called to grow and multiply, becoming more like Christ and helping others follow Him."],
];

/**
 * /community — the public welcome page for the free community.
 *
 * Static: the button reads the sign-in cookie in the browser to choose
 * "Join free" or "Go to the community", so nothing here renders per visitor.
 * The paid membership and its courses are separate and are not opened by
 * joining.
 */
export default function Community() {
  return (
    <main>
      <section className="bg-navy">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-14 text-center sm:px-6 sm:pt-16">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Faithful Path Community</p>
          <h1 className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-sun sm:text-[3rem]" style={DISPLAY}>
            A place to grow, pray and walk with others
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-sand">
            A free community for Christians who want to keep walking with God, and not on their own. Led by Pastor
            Richmond Kobe.
          </p>
          <div className="mt-8">
            <EntryButton />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <section aria-labelledby="who" className="mt-14 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Image
            src={richmond}
            alt="Pastor Richmond Kobe"
            placeholder="blur"
            sizes="10rem"
            className="h-40 w-40 shrink-0 rounded-full object-cover"
          />
          <div>
            <h2 id="who" className="text-2xl text-navy" style={DISPLAY}>
              Who leads it
            </h2>
            <p className="mt-3 leading-relaxed">
              I am Pastor Richmond Kobe. I have been a pastor for more than twenty years, in ten countries, and most of
              what I know about people I learned by sitting with them one at a time. I hold a Master of Theology from
              Trinity Western University in Canada, I am an ordained minister, and I live in Thailand with my family.
            </p>
            <p className="mt-3 leading-relaxed">
              This community is where we pray for one another and meet each week, wherever in the world you are.{" "}
              <Link href="/about" className="font-semibold text-gold-text underline underline-offset-4 hover:text-navy">
                More about me
              </Link>
              .
            </p>
          </div>
        </section>

        <section aria-labelledby="gets" className="mt-14">
          <h2 id="gets" className="text-2xl text-navy" style={DISPLAY}>
            What members get
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {GETS.map((g) => (
              <li key={g.title} className="rounded-2xl border border-gold-line/60 bg-paper p-5">
                <h3 className="text-lg text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                  {g.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed">{g.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            The courses are part of the separate{" "}
            <Link href="/membership" className="font-semibold text-gold-text underline underline-offset-4 hover:text-navy">
              membership
            </Link>{" "}
            (US$19 a month). Joining the community is free and does not include them. Members of the membership are
            already part of the community.
          </p>
        </section>

        <section aria-labelledby="believe" className="mt-14">
          <h2 id="believe" className="text-2xl text-navy" style={DISPLAY}>
            What we believe
          </h2>
          {/* Richmond's wording, 26 October 2026, word for word. */}
          <ul className="mt-5 space-y-3">
            {BELIEFS.map(([lead, rest]) => (
              <li key={lead} className="flex gap-3 leading-relaxed">
                <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>
                  <strong className="font-semibold text-navy">{lead}</strong>
                  {rest}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Join" className="mt-14 rounded-2xl bg-navy px-5 py-10 text-center">
          <p className="text-2xl text-sun" style={DISPLAY}>
            Come and walk with us
          </p>
          <div className="mt-6">
            <EntryButton />
          </div>
        </section>

        <p className="mt-10 text-sm leading-relaxed text-muted">
          The community is a place of prayer and friendship. It is not a substitute for therapy, medical care or
          emergency services. If you are in danger or crisis,{" "}
          <Link href={HELP_PATH} className="font-semibold text-gold-text underline underline-offset-4 hover:text-navy">
            find help where you live
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
