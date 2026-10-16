import { Panel, Plain, SectionHeading } from "@/components/lbyr/LbyrShell";

/**
 * The book's toolkit page of the same name, as a course page.
 *
 * Taken from Lead Before You're Ready, toolkit page 61, with nothing added and
 * nothing softened. The routes below are the book's four, in the book's order.
 *
 * Every lesson footer links here, and several lessons link here from their own
 * help block, because the one thing that must not wait for the relevant lesson
 * is a concern that needs reporting now.
 *
 * Shared by the September edition's page (members only) and the new edition's
 * (open to anyone), so the two can never say different things.
 */
const ROUTES = [
  {
    title: "Ordinary disagreement",
    body: "Clarify the facts and responsibilities. Arrange a suitable conversation, listen and record agreed next steps.",
  },
  {
    title: "Concern about conduct or leadership",
    body: "Use the agreed complaints or oversight route. Seek independent advice where there is a conflict of interest or fear of retaliation.",
  },
  {
    title: "Safeguarding concern or immediate danger",
    body: "Follow the safeguarding reporting process promptly. If someone is in immediate danger, contact local emergency services. Listen without investigating, explain confidentiality limits and keep a factual record in the designated secure system.",
  },
  {
    title: "Ongoing distress or health concerns",
    body: "Offer support within your role and help the person connect with suitable professional care. Persistent hopelessness, loss of interest or marked changes in sleep warrant attention. Immediate danger requires emergency help.",
  },
];

const REFERENCES = [
  "Church of England: receiving safeguarding concerns",
  "NHS: depression in adults",
  "NHS: urgent mental health help",
];

export default function ConcernsCareAndReporting() {
  return (
    <>
      <Panel>
        <h1
          className="text-[clamp(2rem,6vw,2.6rem)] leading-[1.15] text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Concerns, Care and Reporting
        </h1>
        <p className="mt-2 text-[19px] leading-snug text-muted">
          Use with Chapters 3, 7, 8 and 9.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-navy">
          This is a general guide, not a substitute for local safeguarding
          procedures or professional advice.
        </p>
      </Panel>

      <Plain>
        <SectionHeading>Choose the appropriate route</SectionHeading>
        <dl className="mt-5 space-y-4">
          {ROUTES.map((r) => (
            <div key={r.title} className="rounded-xl border border-line px-5 py-4">
              <dt className="text-[18px] font-medium text-navy">{r.title}</dt>
              <dd className="mt-1 text-[17px] leading-relaxed">{r.body}</dd>
            </div>
          ))}
        </dl>
      </Plain>

      <Plain>
        <SectionHeading>Useful references</SectionHeading>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-[18px] leading-relaxed">
          {REFERENCES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          These UK sources inform the general guidance. Reporting arrangements
          and emergency numbers vary by country; use those for your location.
        </p>
      </Plain>
    </>
  );
}
