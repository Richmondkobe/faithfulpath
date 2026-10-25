import { GUIDELINES, GUIDELINES_INTRO, GUIDELINES_VERSE } from "@/lib/community-guidelines";

/** The guidelines in short, for the one-time agreement on the community home. */
export default function GuidelinesList() {
  return (
    <div className="mt-6 rounded-2xl border border-gold-line/60 bg-paper p-5">
      <p className="leading-relaxed">{GUIDELINES_INTRO}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 leading-relaxed marker:font-semibold marker:text-gold-text">
        {GUIDELINES.map(([lead, rest]) => (
          <li key={lead}>
            <strong className="font-semibold text-navy">{lead}</strong>
            {rest}
          </li>
        ))}
      </ol>
      <p className="mt-4 italic text-muted">{GUIDELINES_VERSE}</p>
    </div>
  );
}
