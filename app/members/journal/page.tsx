import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberRow } from "@/lib/member-gate";
import { getMemberByEmail, isActive } from "@/lib/members";
import { getJournal, journalDate, type Journal } from "@/lib/journal";
import { getMindJournal } from "@/lib/mind-journal";
import { getLessons } from "@/lib/course";
import { getCompletion } from "@/lib/course-progress";
import { resetSimpleCompletion } from "@/lib/reset-certificate";
import { mindLessonHref } from "@/lib/mind-links";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import JournalButton from "@/components/course/JournalButton";

const COURSE_SLUG = "christian-spiritual-reset";

export const metadata: Metadata = {
  title: "Your journal",
  robots: { index: false, follow: false },
};

/**
 * The journal, read-only, for any member — including one whose subscription has
 * ended. What they wrote is theirs to keep and to take with them; the course
 * itself stays behind requireActiveMember.
 *
 * Nothing on this page edits. For When Your Mind Won't Rest, an active member
 * gets a link through to the lesson, where the writing happens. The Reset
 * entries were written in its previous edition, now retired, so they link to
 * the current edition instead, and a member who finished it can download the
 * certificate they earned here.
 *
 * Two courses are here, and only two (Richmond, 8 October 2026). The current
 * editions of the other courses store nothing a member writes, by design. The
 * previous Before You Say Yes edition stored answers but was deliberately kept
 * out of the journal and the PDF; those answers stay in the database, unread.
 */
export default async function JournalPage() {
  const email = await requireMemberRow();
  const member = await getMemberByEmail(email);
  const active = isActive(member);

  const [reset, mind, certificate] = await Promise.all([
    getJournal(COURSE_SLUG),
    getMindJournal(),
    resetCertificate(),
  ]);
  const journals: Journal[] = [reset, mind].filter(
    (j): j is Journal => j !== null && j.modules.length > 0
  );
  // The counts and the empty state read across every course at once.
  const entryCount = journals.reduce((n, j) => n + j.entryCount, 0);
  const lastWrittenAt =
    journals
      .map((j) => j.lastWrittenAt)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? null;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <Link
        href="/members"
        className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium"
      >
        ← Members
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Your journal
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Everything you have written through the course, kept in one place. It is
        yours to keep and to take with you.
      </p>

      {!active && (
        <p className="mt-8 rounded-xl border border-line bg-sand px-5 py-4 text-sm leading-relaxed text-muted">
          Your membership is not active, so the lessons are closed and nothing
          here can be edited. Your journal stays readable, and you can download
          it at any time.
        </p>
      )}

      {entryCount > 0 && (
        <p className="mt-8 text-sm text-muted">
          {entryCount} reflection{entryCount === 1 ? "" : "s"}
          {journalDate(lastWrittenAt) && (
            <> · last written {journalDate(lastWrittenAt)}</>
          )}
        </p>
      )}

      <div className="mt-6">
        <JournalButton variant="primary" />
      </div>

      {/* The previous Reset edition is retired, and its pages with it, so this
          is the one place a member who finished it can still download the
          certificate they earned. Same check as the certificate route, which
          also needs an active membership. */}
      {active && certificate && (
        <div className="mt-8 rounded-xl border border-line bg-sand px-5 py-5">
          <p className="text-navy">Your certificate</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            You completed the previous edition of The Christian Spiritual Reset.
          </p>
          <Link
            href={`/members/courses/${COURSE_SLUG}/certificate`}
            prefetch={false}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
          >
            Download your certificate
          </Link>
        </div>
      )}

      {journals.length === 0 ? (
        <div className="mt-12 rounded-xl border border-line bg-sand px-5 py-5">
          <p className="text-navy">Nothing written yet</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your reflections and next steps will appear here as you work through
            the course.
          </p>
          {active && (
            <Link
              href={RESET_NEW_PATH}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
            >
              Go to the course
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-14 space-y-16">
          {journals.map((journal) => (
            <section key={journal.courseSlug}>
              {/* Named per course, because a member may have written in both
                  and the entries only make sense under the course they belong
                  to. */}
              <h2
                className="text-2xl text-navy"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {journal.courseTitle}
              </h2>
              {/* The Reset entries were written in the previous edition, whose
                  lesson pages are retired; they open the current edition. */}
              {journal.courseSlug === COURSE_SLUG && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Written in the previous edition of the course.
                  {active && (
                    <>
                      {" "}
                      <Link
                        href={RESET_NEW_PATH}
                        className="text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
                      >
                        Open the current edition
                      </Link>
                    </>
                  )}
                </p>
              )}

              <div className="mt-8 space-y-14">
          {journal.modules.map((mod, mi) => (
            <section key={`${mod.title}-${mi}`}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
                Module {mi + 1}
              </p>
              <h2
                className="mt-2 text-2xl text-navy"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                {mod.title}
              </h2>

              <div className="mt-6 space-y-10">
                {mod.lessons.map((lesson) => (
                  <article
                    key={lesson.slug}
                    className="border-t border-line pt-6"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3
                        className="text-lg leading-snug text-navy"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                      >
                        {lesson.order}. {lesson.title}
                      </h3>
                      {journalDate(lesson.lastWrittenAt) && (
                        <p className="text-sm text-muted">
                          {journalDate(lesson.lastWrittenAt)}
                        </p>
                      )}
                    </div>

                    {lesson.answers.map((entry, i) => (
                      <div key={i} className="mt-5">
                        <p
                          className="text-[15px] leading-snug text-gold-text"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                        >
                          {entry.prompt}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-navy">
                          {entry.answer}
                        </p>
                      </div>
                    ))}

                    {lesson.nextStep && (
                      <div className="mt-5 rounded-xl border border-line bg-sand px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
                          Your next step
                        </p>
                        <p className="mt-2 text-[15px] leading-relaxed text-navy">
                          {lesson.nextStep.action}
                        </p>
                        {lesson.nextStep.done && (
                          <p className="mt-2 text-sm text-muted">
                            {journalDate(lesson.nextStep.doneAt)
                              ? `Marked done on ${journalDate(lesson.nextStep.doneAt)}.`
                              : "Marked done."}
                          </p>
                        )}
                        {lesson.nextStep.followupAnswer && (
                          <p className="mt-1 text-sm text-muted">
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

                    {active && journal.courseSlug !== COURSE_SLUG && (
                      <Link
                        href={mindLessonHref(lesson.slug)}
                        className="mt-4 inline-block text-sm text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
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
            </section>
          ))}
        </div>
      )}

      <div className="mt-16 border-t border-line pt-10">
        <JournalButton />
      </div>
    </main>
  );
}

/**
 * Whether the member finished the previous Reset edition and gave a name to
 * print: the same two readings the certificate route makes, read-only.
 */
async function resetCertificate(): Promise<boolean> {
  const lessons = getLessons(COURSE_SLUG);
  if (lessons.length === 0) return false;
  let completion = await getCompletion(COURSE_SLUG, lessons[lessons.length - 1].slug);
  if (!completion.complete) {
    const simple = await resetSimpleCompletion();
    if (simple.complete) completion = simple;
  }
  return completion.complete && Boolean(completion.name);
}
