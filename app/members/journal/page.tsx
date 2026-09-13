import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberRow } from "@/lib/member-gate";
import { getMemberByEmail, isActive } from "@/lib/members";
import { getJournal, journalDate } from "@/lib/journal";
import { lessonHref } from "@/lib/course";
import JournalButton from "@/components/course/JournalButton";

const COURSE_SLUG = "christian-spiritual-reset";

export const metadata: Metadata = {
  title: "Your journal | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The journal, read-only, for any member — including one whose subscription has
 * ended. What they wrote is theirs to keep and to take with them; the course
 * itself stays behind requireActiveMember.
 *
 * Nothing on this page edits. A member who is still active gets a link through
 * to the lesson, where the writing actually happens.
 */
export default async function JournalPage() {
  const email = await requireMemberRow();
  const member = await getMemberByEmail(email);
  const active = isActive(member);

  const journal = await getJournal(COURSE_SLUG);

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href="/members"
        className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]"
      >
        ← Members
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Your journal
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Everything you have written through the course, kept in one place. It is
        yours to keep and to take with you.
      </p>

      {!active && (
        <p className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 text-sm leading-relaxed text-[#6B5F53]">
          Your membership is not active, so the lessons are closed and nothing
          here can be edited. Your journal stays readable, and you can download
          it at any time.
        </p>
      )}

      {journal && journal.entryCount > 0 && (
        <p className="mt-8 text-sm text-[#6B5F53]">
          {journal.entryCount} reflection{journal.entryCount === 1 ? "" : "s"}
          {journalDate(journal.lastWrittenAt) && (
            <> · last written {journalDate(journal.lastWrittenAt)}</>
          )}
        </p>
      )}

      <div className="mt-6">
        <JournalButton variant="primary" />
      </div>

      {!journal || journal.modules.length === 0 ? (
        <div className="mt-12 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-5">
          <p className="text-[#2B2118]">Nothing written yet</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5F53]">
            Your reflections and next steps will appear here as you work through
            the course.
          </p>
          {active && (
            <Link
              href={`/members/courses/${COURSE_SLUG}`}
              className="mt-5 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
            >
              Go to the course
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-14 space-y-14">
          {journal.modules.map((mod, mi) => (
            <section key={`${mod.title}-${mi}`}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                Module {mi + 1}
              </p>
              <h2
                className="mt-2 text-2xl text-[#2B2118]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {mod.title}
              </h2>

              <div className="mt-6 space-y-10">
                {mod.lessons.map((lesson) => (
                  <article
                    key={lesson.slug}
                    className="border-t border-[#E5D9C7] pt-6"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3
                        className="text-lg leading-snug text-[#2B2118]"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                      >
                        {lesson.order}. {lesson.title}
                      </h3>
                      {journalDate(lesson.lastWrittenAt) && (
                        <p className="text-sm text-[#6B5F53]">
                          {journalDate(lesson.lastWrittenAt)}
                        </p>
                      )}
                    </div>

                    {lesson.answers.map((entry, i) => (
                      <div key={i} className="mt-5">
                        <p
                          className="text-[15px] leading-snug text-[#8B5E34]"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                        >
                          {entry.prompt}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#2B2118]">
                          {entry.answer}
                        </p>
                      </div>
                    ))}

                    {lesson.nextStep && (
                      <div className="mt-5 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                          Your next step
                        </p>
                        <p className="mt-2 text-[15px] leading-relaxed text-[#2B2118]">
                          {lesson.nextStep.action}
                        </p>
                        {lesson.nextStep.done && (
                          <p className="mt-2 text-sm text-[#6B5F53]">
                            {journalDate(lesson.nextStep.doneAt)
                              ? `Marked done on ${journalDate(lesson.nextStep.doneAt)}.`
                              : "Marked done."}
                          </p>
                        )}
                        {lesson.nextStep.followupAnswer && (
                          <p className="mt-1 text-sm text-[#6B5F53]">
                            {lesson.nextStep.followupPrompt
                              ? `${lesson.nextStep.followupPrompt} `
                              : ""}
                            {lesson.nextStep.followupAnswer === "yes"
                              ? "Yes"
                              : lesson.nextStep.followupAnswer === "no"
                                ? "No"
                                : lesson.nextStep.followupAnswer}
                          </p>
                        )}
                      </div>
                    )}

                    {active && (
                      <Link
                        href={lessonHref(COURSE_SLUG, lesson.slug)}
                        className="mt-4 inline-block text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                      >
                        Open the lesson
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <JournalButton />
      </div>
    </main>
  );
}
