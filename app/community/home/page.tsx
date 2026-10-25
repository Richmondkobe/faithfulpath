import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CommunityNav from "@/components/community/CommunityNav";
import CommunityFooter from "@/components/community/CommunityFooter";
import ProfileForm from "@/components/community/ProfileForm";
import Markdown from "@/components/Markdown";
import MarkJoined from "@/components/community/MarkJoined";
import { DISPLAY, buttonClass, errorClass, quietButtonClass } from "@/components/community/styles";
import GuidelinesList from "@/components/community/GuidelinesList";
import { GUIDELINES_PATH } from "@/lib/community-guidelines";
import { getCommunityViewer, loadAnnouncements, loadAnswered } from "@/lib/community-db";
import { COMMUNITY_SIGN_IN, prayerName, shortDate } from "@/lib/community";
import { agreeToGuidelines, leaveCommunity } from "@/app/community/actions";

export const metadata: Metadata = {
  title: "Community home",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ leave?: string }> };

/**
 * The signed-in community home. Someone signed in who has not joined (they
 * used the emailed link, or they came from the membership) is asked for a
 * first name and country here; a paying member can use the community without
 * them, but needs them to post a prayer request.
 */
export default async function CommunityHome({ searchParams }: Props) {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect(COMMUNITY_SIGN_IN);
  const { leave } = await searchParams;
  const meta = viewer.user.user_metadata as { full_name?: string; country?: string } | undefined;

  if (viewer.removed) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Faithful Path Community</p>
        <h1 className="mt-3 text-[2.25rem] leading-[1.1] text-navy" style={DISPLAY}>
          The community is closed to this account
        </h1>
        <p className="mt-5 text-lg leading-relaxed">
          Pastor Richmond has removed this email address from the community. If you have a membership or have bought a
          book or course, those are not affected. You can write to info@faithfulpathcommunity.com.
        </p>
      </main>
    );
  }

  if (viewer.needsAgreement) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Faithful Path Community</p>
        <h1 className="mt-3 text-[2.25rem] leading-[1.1] text-navy" style={DISPLAY}>
          Our Community Guidelines
        </h1>
        <p className="mt-5 text-lg leading-relaxed">
          To keep the community safe and encouraging for everyone, every member now agrees to a few simple guidelines.
          Please read them, then tick the box to carry on. You only need to do this once.
        </p>
        <GuidelinesList />
        <form action={agreeToGuidelines} className="mt-8 space-y-5">
          <label className="flex items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-navy">
            <input type="checkbox" name="agree_guidelines" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#a97a29]" />
            <span className="leading-snug">
              I have read and agree to the{" "}
              <Link href={GUIDELINES_PATH} className="font-semibold text-gold-text underline underline-offset-4">
                Community Guidelines
              </Link>
            </span>
          </label>
          <button type="submit" className={buttonClass}>
            Agree and continue
          </button>
        </form>
      </main>
    );
  }

  if (!viewer.inCommunity) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Faithful Path Community</p>
        <h1 className="mt-3 text-[2.25rem] leading-[1.1] text-navy" style={DISPLAY}>
          One last step
        </h1>
        <p className="mt-5 text-lg leading-relaxed">Tell us a little about yourself, and you are in.</p>
        <ProfileForm fullName={meta?.full_name ?? ""} country={meta?.country ?? ""} joining submitLabel="Join the community" />
      </main>
    );
  }

  const name = viewer.profile?.first_name;
  const [{ announcements, seenBefore }, [latestAnswer]] = await Promise.all([loadAnnouncements(viewer), loadAnswered(viewer, 1)]);
  const isNew = (createdAt: string) => !seenBefore || new Date(createdAt).getTime() > seenBefore.getTime();

  return (
    <>
      <CommunityNav current="home" />
      <MarkJoined />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <h1 className="text-[2.25rem] leading-[1.1] text-navy sm:text-[2.75rem]" style={DISPLAY}>
          {name ? `Welcome, ${name}` : "Welcome to the community"}
        </h1>
        <p className="mt-4 text-lg leading-relaxed">A place to grow, pray and walk with others.</p>

        {announcements.length > 0 && (
          <section aria-labelledby="announcements" className="mt-10">
            <h2 id="announcements" className="text-xl text-navy" style={DISPLAY}>
              Announcements
            </h2>
            <ul className="mt-4 space-y-4">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className={`rounded-2xl border bg-paper p-5 ${a.pinned ? "border-gold-line" : "border-line"}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned && (
                      <span className="rounded-full bg-sand px-3 py-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-gold-text">
                        Pinned
                      </span>
                    )}
                    {isNew(a.created_at) && (
                      <span className="rounded-full bg-navy px-3 py-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-sun">
                        New
                      </span>
                    )}
                    <span className="text-[13px] text-muted">{shortDate(a.created_at)}</span>
                  </div>
                  <h3 className="mt-2 text-xl text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                    {a.title}
                  </h3>
                  <div className="mt-3">
                    <Markdown source={a.body} />
                  </div>
                  {a.link_url && (
                    <a
                      href={a.link_url}
                      {...(a.link_url.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-gold px-6 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
                    >
                      {a.link_label || "Find out more"}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/community/prayer"
              className="block h-full rounded-2xl bg-navy p-6 transition-colors hover:bg-night"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Pray together</p>
              <p className="mt-2 text-2xl text-sun" style={DISPLAY}>
                Prayer Wall
              </p>
              <p className="mt-2 leading-relaxed text-sand">Share a request, and pray for others.</p>
              <span className="mt-4 inline-block font-semibold text-gold-soft">Open the Prayer Wall ›</span>
            </Link>
          </li>
          <li>
            <Link
              href="/community/gathering"
              className="block h-full rounded-2xl border border-gold-line/60 bg-paper p-6 transition-colors hover:border-gold-line"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Every week, online</p>
              <p className="mt-2 text-2xl text-navy" style={DISPLAY}>
                Weekly Gathering
              </p>
              <p className="mt-2 leading-relaxed">The next time we meet, in your own time zone.</p>
              <span className="mt-4 inline-block font-semibold text-gold-text">See the next gathering ›</span>
            </Link>
          </li>
        </ul>

        <Link
          href="/community/questions"
          className="mt-4 block rounded-2xl border border-gold-line/60 bg-paper p-6 transition-colors hover:border-gold-line"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Questions and answers</p>
          <p className="mt-2 text-2xl text-navy" style={DISPLAY}>
            Ask Pastor Richmond
          </p>
          <p className="mt-2 leading-relaxed">Ask about faith, the Bible or following Jesus, and read his answers.</p>
          <span className="mt-4 inline-block font-semibold text-gold-text">Ask a question ›</span>
        </Link>

        {/* The latest shared answered prayer; nothing until there is one. */}
        {latestAnswer && (
          <section aria-labelledby="latest-answer" className="mt-4 rounded-2xl border border-gold-line/60 bg-paper p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Answered 🙌</p>
            <h2 id="latest-answer" className="mt-2 text-xl text-navy" style={DISPLAY}>
              God is answering prayer
            </h2>
            <p className="mt-2 line-clamp-3 leading-relaxed">{latestAnswer.note ?? latestAnswer.request.body}</p>
            <p className="mt-2 text-[13px] text-muted">
              {prayerName(latestAnswer.request)} · {shortDate(latestAnswer.request.answered_at ?? latestAnswer.created_at)}
            </p>
            <Link href="/community/answered" className="mt-4 inline-block font-semibold text-gold-text underline underline-offset-4">
              See all answered prayers ›
            </Link>
          </section>
        )}

        {/* For anyone without a live paid membership (Richmond, 26 October 2026). */}
        {!viewer.paidMember && (
          <section
            aria-labelledby="courses"
            className="mt-4 rounded-2xl border border-gold-line/60 bg-paper p-6"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">Go deeper</p>
            <h2 id="courses" className="mt-2 text-2xl text-navy" style={DISPLAY}>
              Courses with Pastor Richmond
            </h2>
            <p className="mt-2 leading-relaxed">
              Five Christian courses on rest, worry, dating, marriage and church leadership. Learn at your own pace.
              US$19 a month, cancel any time.
            </p>
            <Link
              href="/membership"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-7 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
            >
              See the membership
            </Link>
          </section>
        )}

        <Link
          href="/give"
          className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-6 py-4 transition-colors hover:border-gold-line"
        >
          <span>
            <span className="block text-lg text-navy" style={DISPLAY}>
              Support the ministry
            </span>
            <span className="mt-0.5 block text-[15px] text-muted">Help keep the community free for everyone.</span>
          </span>
          <span aria-hidden="true" className="text-xl text-gold-text">›</span>
        </Link>

        <section aria-labelledby="profile" className="mt-14 border-t border-line pt-8">
          <h2 id="profile" className="text-xl text-navy" style={DISPLAY}>
            {viewer.profile ? "Your details" : "Tell us about yourself"}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {viewer.profile
              ? `Signed in as ${viewer.email}. Only your first name is ever shown, and only on prayer requests you choose to share with your name.`
              : "You are already in the community. Tell us a little about yourself to share prayer requests."}
          </p>
          <ProfileForm
            fullName={viewer.profile?.full_name ?? meta?.full_name ?? ""}
            country={viewer.profile?.country ?? meta?.country ?? ""}
            phone={viewer.profile?.phone ?? ""}
            joining={!viewer.profile}
            submitLabel="Save"
          />
        </section>

        {viewer.profile && (
          <section aria-labelledby="leave" className="mt-12 border-t border-line pt-8">
            <h2 id="leave" className="text-xl text-navy" style={DISPLAY}>
              Leave the community
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              This deletes your community details and every prayer request you have shared. It does not affect a
              membership or anything you have bought.
            </p>
            {leave === "failed" && (
              <p role="alert" className={`mt-4 ${errorClass}`}>
                That did not work just now. Please try again, or write to info@faithfulpathcommunity.com.
              </p>
            )}
            {leave === "confirm" ? (
              <form action={leaveCommunity} className="mt-4 flex flex-wrap items-center gap-3">
                <input type="hidden" name="confirm" value="yes" />
                <button type="submit" className="min-h-11 rounded-xl bg-danger px-5 text-sm font-semibold text-white">
                  Yes, delete my community details
                </button>
                <Link href="/community/home" className="text-sm underline underline-offset-4">
                  Cancel
                </Link>
              </form>
            ) : (
              <form action={leaveCommunity} className="mt-4">
                <button type="submit" className={quietButtonClass}>
                  Leave the community…
                </button>
              </form>
            )}
          </section>
        )}
      </main>
      <CommunityFooter />
    </>
  );
}
