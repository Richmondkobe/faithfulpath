import type { Metadata } from "next";
import Link from "next/link";
import CommunityNav from "@/components/community/CommunityNav";
import CommunityFooter from "@/components/community/CommunityFooter";
import QuestionForm from "@/components/community/QuestionForm";
import Markdown from "@/components/Markdown";
import { DISPLAY, inputClass, okClass, quietButtonClass } from "@/components/community/styles";
import { loadQuestions, requireCommunity } from "@/lib/community-db";
import { QUESTIONS_PER_WEEK, prayerName, shortDate, type CommunityQuestion } from "@/lib/community";
import { GUIDELINES_PATH } from "@/lib/community-guidelines";
import { deleteOwnQuestion, reportQuestion } from "@/app/community/actions";

// Signed-in members only (requireCommunity), never cached, and kept out of
// search: noindex here and Disallow in robots.ts.
export const metadata: Metadata = {
  title: "Ask Pastor Richmond",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string; report?: string; reported?: string }> };

const MINE_NOTE: Record<CommunityQuestion["status"], string> = {
  pending: "Waiting for Pastor Richmond",
  declined: "Not answered on the board",
  published: "",
};

export default async function AskPastorRichmond({ searchParams }: Props) {
  const viewer = await requireCommunity();
  const sp = await searchParams;
  const { published, mine, reported, askedThisWeek } = await loadQuestions(viewer);
  const search = (sp.q ?? "").trim().slice(0, 100);
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = words.length
    ? published.filter((q) => words.every((w) => `${q.body} ${q.answer ?? ""}`.toLowerCase().includes(w)))
    : published;

  return (
    <>
      <CommunityNav current="questions" />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <h1 className="text-[2.25rem] leading-[1.1] text-navy sm:text-[2.75rem]" style={DISPLAY}>
          Ask Pastor Richmond
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          Ask a question about faith, the Bible or following Jesus. Pastor Richmond answers here, for the whole community
          to read.
        </p>

        {sp.reported === "1" && (
          <p role="status" className={`mt-6 ${okClass}`}>
            Thank you. That question is off the board until Pastor Richmond has looked at it.
          </p>
        )}

        <section aria-labelledby="ask" className="mt-8 rounded-2xl border border-gold-line/60 bg-cream p-5 sm:p-6">
          <h2 id="ask" className="text-xl text-navy" style={DISPLAY}>
            Ask a question
          </h2>
          {viewer.profile?.is_banned ? (
            <p className="mt-3 leading-relaxed text-muted">Asking questions is closed on this account.</p>
          ) : !viewer.profile ? (
            <p className="mt-3 leading-relaxed text-muted">
              Add your details on the{" "}
              <Link href="/community/home#profile" className="font-semibold text-gold-text underline underline-offset-4">
                community home
              </Link>{" "}
              first, and then you can ask here.
            </p>
          ) : askedThisWeek >= QUESTIONS_PER_WEEK ? (
            <p className="mt-3 leading-relaxed text-muted">
              You have asked {QUESTIONS_PER_WEEK} questions this week. You can ask another once a week has passed since
              the first.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Up to {QUESTIONS_PER_WEEK} questions a week. Only questions Pastor Richmond answers are shown. Please keep
                to the{" "}
                <Link href={GUIDELINES_PATH} className="underline underline-offset-4">
                  Community Guidelines
                </Link>
                .
              </p>
              <div className="mt-5">
                <QuestionForm firstName={viewer.profile.first_name} />
              </div>
            </>
          )}
        </section>

        {mine.length > 0 && (
          <section aria-labelledby="yours" className="mt-10">
            <h2 id="yours" className="text-xl text-navy" style={DISPLAY}>
              Your questions not on the board
            </h2>
            <ul className="mt-4 space-y-3">
              {mine.map((q) => (
                <li key={q.id} className="rounded-2xl border border-line bg-paper p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-sand px-3 py-1 text-[13px] font-medium text-gold-text">{MINE_NOTE[q.status]}</span>
                    <span className="text-[13px] text-muted">{shortDate(q.created_at)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-line leading-relaxed">{q.body}</p>
                  <form action={deleteOwnQuestion} className="mt-3">
                    <input type="hidden" name="id" value={q.id} />
                    <button type="submit" className="min-h-11 text-[13px] text-muted underline underline-offset-4 hover:text-danger">
                      Delete my question
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="answers" className="mt-10">
          <h2 id="answers" className="text-xl text-navy" style={DISPLAY}>
            Answered questions
          </h2>
          <form role="search" method="GET" className="mt-4 flex gap-2">
            <label htmlFor="q" className="sr-only">
              Search the answered questions
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={search}
              placeholder="Search, e.g. prayer, forgiveness"
              className={`${inputClass} mt-0`}
            />
            <button type="submit" className={`${quietButtonClass} shrink-0`}>
              Search
            </button>
          </form>
          {search && (
            <p className="mt-3 text-[15px] text-muted">
              {shown.length} {shown.length === 1 ? "answer" : "answers"} for &ldquo;{search}&rdquo;.{" "}
              <Link href="/community/questions" className="underline underline-offset-4">
                Show all
              </Link>
            </p>
          )}
          {published.length === 0 ? (
            <p className="mt-6 leading-relaxed text-muted">No questions have been answered yet. Yours could be the first.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {shown.map((q) => (
                <li key={q.id} id={`q-${q.id}`} className="scroll-mt-6 rounded-2xl border border-gold-line/60 bg-paper p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-semibold text-navy">{prayerName(q)} asked</p>
                    <p className="text-[13px] text-muted">Answered {shortDate(q.published_at ?? q.created_at)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-navy" style={DISPLAY}>
                    {q.body}
                  </p>
                  <div className="mt-4 border-l-2 border-gold pl-4">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-text">Pastor Richmond</p>
                    <div className="mt-2">
                      <Markdown source={q.answer ?? ""} />
                    </div>
                  </div>
                  {q.user_id !== viewer.user.id && (
                    <div className="mt-4 text-[13px]">
                      {reported.has(q.id) ? (
                        <span className="text-muted">Reported</span>
                      ) : sp.report === q.id ? (
                        <form action={reportQuestion} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="confirm" value="yes" />
                          <span className="text-muted">Send this back to Pastor Richmond to review?</span>
                          <button type="submit" className="min-h-11 font-semibold text-danger underline underline-offset-4">
                            Yes, report it
                          </button>
                          <Link href={`/community/questions#q-${q.id}`} className="min-h-11 content-center underline underline-offset-4">
                            Cancel
                          </Link>
                        </form>
                      ) : (
                        <form action={reportQuestion}>
                          <input type="hidden" name="id" value={q.id} />
                          <button type="submit" className="min-h-11 text-muted underline underline-offset-4 hover:text-danger">
                            Report
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <CommunityFooter />
    </>
  );
}
