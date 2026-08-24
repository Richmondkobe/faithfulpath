import Image from "next/image";
import Link from "next/link";
import { SITE, COUNTRIES } from "@/lib/site";
import { ALL_ARTICLES as ARTICLES } from "@/lib/articles";

const STAGES = [
  {
    label: "Before",
    title: "You write to me",
    body:
      "You answer a few questions in writing — where you are, what happened, what you're carrying. I read it and pray over it before we ever meet.",
  },
  {
    label: "The hour",
    title: "We talk",
    body:
      "Sixty minutes, face to face over video. Mostly I listen. Where scripture speaks to what you're facing, I'll bring it — plainly, not as a lecture.",
  },
  {
    label: "After",
    title: "I write back",
    body:
      "Within 24 hours: what I heard, passages to sit with, and two or three concrete next steps. Something to return to later.",
  },
];

export default function Home() {
  const recent = ARTICLES.slice(0, 3);

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-12 sm:grid-cols-[1.15fr_1fr]">
          <div>
            <h1
              className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Some things you cannot work out alone.
            </h1>
            <p
              className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              I am Richmond — a pastor of more than twenty years, across ten
              countries. This is where I write, teach, and sit down with people
              one at a time.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/talk-to-a-pastor"
                className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
              >
                Talk to a pastor — {SITE.price}
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center justify-center rounded-sm border border-[#E5D9C7] px-7 py-4 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
              >
                Read the articles
              </Link>
            </div>
          </div>
          <div className="order-first sm:order-last">
            <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-sm sm:max-w-none">
              <Image
                src="/richmond.jpg"
                alt="Richmond, pastor at Faithful Path Community"
                fill
                priority
                sizes="(max-width: 640px) 20rem, 24rem"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E5D9C7] bg-[#F3EADC]">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {[
              ["20", "years pastoring"],
              ["10", "countries"],
              ["1,000+", "people counselled"],
              ["18", "books written"],
            ].map(([figure, label]) => (
              <div key={label}>
                <dt
                  className="text-3xl text-[#2B2118] sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  {figure}
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-[#6B5F53]">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#7C7065]">
            {COUNTRIES.join(" · ")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2
          className="text-3xl tracking-[-0.01em] text-[#2B2118] sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          One honest hour
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed">
          A private conversation, online, wherever you are. No church membership
          required, and you do not have to arrive with faith intact.
        </p>
        <div className="mt-8 divide-y divide-[#E5D9C7] border-y border-[#E5D9C7]">
          {STAGES.map((stage) => (
            <div
              key={stage.label}
              className="grid gap-2 py-6 sm:grid-cols-[5rem_1fr] sm:gap-6"
            >
              <p className="pt-1 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                {stage.label}
              </p>
              <div>
                <h3
                  className="text-xl text-[#2B2118]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {stage.title}
                </h3>
                <p className="mt-2 max-w-2xl leading-relaxed">{stage.body}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/talk-to-a-pastor"
          className="mt-10 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          See how it works
        </Link>
      </section>

      <section className="border-t border-[#E5D9C7] bg-[#F3EADC]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2
            className="text-3xl tracking-[-0.01em] text-[#2B2118] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Writing and teaching
          </h2>
          {recent.length === 0 ? (
            <p className="mt-6 max-w-xl leading-relaxed text-[#6B5F53]">
              Articles are on their way.
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-[#E5D9C7] border-y border-[#E5D9C7]">
              {recent.map((a) => (
                <li key={a.slug} className="py-6">
                  <Link href={"/articles/" + a.slug} className="group block">
                    <h3
                      className="text-xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                    >
                      {a.title}
                    </h3>
                    <p className="mt-2 max-w-2xl leading-relaxed">{a.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/articles"
            className="mt-8 inline-block text-[15px] font-medium text-[#8B5E34] underline-offset-4 hover:underline"
          >
            All articles
          </Link>
        </div>
      </section>
    </main>
  );
}
