import Link from "next/link";

/**
 * "Start with your question": four permanent starting points above the latest
 * articles on /articles (Growth Report, 9 November 2026). Each path gives one
 * guide to read, one practical resource and one next step. Every link here is
 * a live page; if one is renamed, change it here as well.
 */
type Step = { label: string; title: string; href: string };
type Path = { question: string; steps: Step[] };

const PATHS: Path[] = [
  {
    question: "I’m new to following Jesus",
    steps: [
      { label: "Read", title: "What Does It Mean to Be Born Again?", href: "/articles/what-does-it-mean-to-be-born-again" },
      { label: "Try", title: "How to Study the Bible for Beginners", href: "/articles/how-to-study-the-bible-for-beginners" },
      { label: "Next step", title: "The Following Jesus courses", href: "/courses/following-jesus" },
    ],
  },
  {
    question: "We’re dating or engaged",
    steps: [
      { label: "Read", title: "12 Christian Dating Tips", href: "/articles/christian-dating-tips" },
      { label: "Try", title: "25 Questions to Ask Before Marriage", href: "/articles/questions-to-ask-before-marriage-christian" },
      { label: "Next step", title: "Before You Say Yes (dating) or Talk Before You Marry (engaged)", href: "/guides/before-you-say-yes" },
    ],
  },
  {
    question: "I’m worried or worn out",
    steps: [
      { label: "Read", title: "How to Stop Overthinking as a Christian", href: "/articles/how-to-stop-overthinking-christian" },
      { label: "Try", title: "A Christian Night-Time Practice for a Racing Mind", href: "/articles/christian-night-time-practice-racing-mind" },
      { label: "Next step", title: "Talk it through with Pastor Richmond", href: "/talk-to-a-pastor" },
    ],
  },
  {
    question: "I lead in a church or small group",
    steps: [
      { label: "Read", title: "Church Leadership Training: A Biblical Guide", href: "/articles/christian-leadership-training" },
      { label: "Try", title: "30 Small Group Bible Study Topics", href: "/articles/small-group-bible-study-topics" },
      { label: "Next step", title: "Lead Before You’re Ready", href: "/guides/lead-before-youre-ready" },
    ],
  },
];

export default function StartPaths() {
  return (
    <section aria-labelledby="start-paths" className="mt-12">
      <h2
        id="start-paths"
        className="text-2xl text-navy sm:text-3xl"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Start with your question
      </h2>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PATHS.map((path) => (
          <li key={path.question} className="rounded-2xl border border-gold-line/60 bg-paper p-5">
            <h3 className="text-lg leading-snug text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
              {path.question}
            </h3>
            <ul className="mt-4 space-y-3">
              {path.steps.map((step) => (
                <li key={step.label}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gold-text">{step.label}</p>
                  <Link
                    href={step.href}
                    className="mt-0.5 inline-block leading-snug text-ink underline decoration-gold-line underline-offset-4 transition-colors hover:text-navy"
                  >
                    {step.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
