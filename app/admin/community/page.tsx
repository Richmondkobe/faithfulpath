import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingCommunityTable } from "@/lib/community-db";
import {
  bangkokDate,
  prayerName,
  shortDate,
  upcomingOccurrences,
  type Announcement,
  type CommunityProfile,
  type Gathering,
  type PrayerRequest,
} from "@/lib/community";
import { inputClass, labelClass } from "@/components/community/styles";
import {
  approvePrayer,
  deleteAnnouncement,
  deleteGathering,
  deletePrayer,
  rejectPrayer,
  retryAnnouncementEmail,
  resendWelcome,
  retryMailerLite,
  saveAnnouncement,
  saveGathering,
  setBanned,
  toggleSkipWeek,
} from "@/app/admin/community/actions";

// Emailing an announcement waits for MailerLite.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Community",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    done?: string;
    error?: string;
    delete?: string;
    deleteGathering?: string;
    deleteAnnouncement?: string;
  }>;
};

const H2 = "text-2xl text-navy";
const DISPLAY = { fontFamily: "var(--font-display)", fontWeight: 500 } as const;
const small =
  "inline-flex min-h-10 items-center rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-navy transition-colors hover:border-gold-line";
const gold = "inline-flex min-h-10 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-night hover:bg-gold-soft";
const danger = "inline-flex min-h-10 items-center rounded-lg bg-danger px-3 text-sm font-semibold text-white";

/** A moment, written as Bangkok wall-clock time for a datetime-local field. */
function bangkokLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** A gathering's coming dates. This page is rendered per request, never cached. */
const coming = (g: Gathering, all: Gathering[], count: number) => upcomingOccurrences(g, all, Date.now(), count);

const bangkokDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });

const bangkokLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Bangkok" });

function AnnouncementForm({ a }: { a?: Announcement }) {
  const key = a?.id ?? "new";
  return (
    <form action={saveAnnouncement} className="space-y-4">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div>
        <label htmlFor={`atitle-${key}`} className={labelClass}>
          Title
        </label>
        <input id={`atitle-${key}`} name="title" required maxLength={150} defaultValue={a?.title} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`abody-${key}`} className={labelClass}>
          Message (Markdown: **bold**, *italics*, [link](https://…), - lists)
        </label>
        <textarea id={`abody-${key}`} name="body" required rows={6} maxLength={10000} defaultValue={a?.body} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`alabel-${key}`} className={labelClass}>
            Button text (optional)
          </label>
          <input id={`alabel-${key}`} name="link_label" maxLength={60} placeholder="Find out more" defaultValue={a?.link_label ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`aurl-${key}`} className={labelClass}>
            Button link (optional)
          </label>
          <input id={`aurl-${key}`} name="link_url" placeholder="https://… or /community/gathering" defaultValue={a?.link_url ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <label className="flex min-h-11 items-center gap-2 text-navy">
          <input type="checkbox" name="pinned" defaultChecked={a?.pinned} className="h-5 w-5 accent-[#a97a29]" />
          Pin to top
        </label>
        {!a?.emailed_at && (
          <label className="flex min-h-11 items-center gap-2 text-navy">
            <input type="checkbox" name="email" className="h-5 w-5 accent-[#a97a29]" />
            Also email this to the community
          </label>
        )}
      </div>
      <button type="submit" className={gold}>
        {a ? "Save changes" : "Post announcement"}
      </button>
    </form>
  );
}

function GatheringForm({ g }: { g?: Gathering }) {
  const key = g?.id ?? "new";
  return (
    <form action={saveGathering} className="space-y-4">
      {g && <input type="hidden" name="id" value={g.id} />}
      <div>
        <label htmlFor={`title-${key}`} className={labelClass}>
          Title
        </label>
        <input id={`title-${key}`} name="title" required maxLength={120} defaultValue={g?.title} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`desc-${key}`} className={labelClass}>
          Description
        </label>
        <textarea id={`desc-${key}`} name="description" rows={3} maxLength={2000} defaultValue={g?.description ?? ""} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`when-${key}`} className={labelClass}>
            Date and time (Bangkok time)
          </label>
          <input
            id={`when-${key}`}
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={g ? bangkokLocal(g.starts_at) : ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`zoom-${key}`} className={labelClass}>
            Zoom link
          </label>
          <input
            id={`zoom-${key}`}
            name="zoom_url"
            type="url"
            required
            placeholder="https://zoom.us/j/…"
            defaultValue={g?.zoom_url}
            className={inputClass}
          />
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-navy">
        <input
          type="checkbox"
          name="repeats_weekly"
          defaultChecked={g ? g.repeats_weekly : true}
          className="h-5 w-5 accent-[#a97a29]"
        />
        Repeats every week
      </label>
      <button type="submit" className={gold}>
        {g ? "Save changes" : "Add gathering"}
      </button>
    </form>
  );
}

export default async function AdminCommunity({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [requests, profiles, gatherings, notices] = await Promise.all([
    supabase.from("prayer_requests").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("community_profiles").select("*").order("joined_at", { ascending: false }),
    supabase.from("community_gatherings").select("*").order("starts_at", { ascending: false }).limit(30),
    supabase
      .from("community_announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if ([requests, profiles, gatherings, notices].some((r) => isMissingCommunityTable(r.error))) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl text-navy" style={DISPLAY}>
          Community
        </h1>
        <p className="mt-4 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-danger">
          The community tables are not in Supabase yet. Run supabase/migrations/20261026120000_community.sql in the
          Supabase SQL editor first.
        </p>
      </main>
    );
  }
  const loadError = [requests, profiles, gatherings, notices].find((r) => r.error)?.error;
  const announcements = (notices.data ?? []) as Announcement[];

  const all = (requests.data ?? []) as PrayerRequest[];
  const people = (profiles.data ?? []) as CommunityProfile[];
  const byUser = new Map(people.map((p) => [p.user_id, p]));
  const pending = all.filter((r) => r.status === "pending");
  const approved = all.filter((r) => r.status === "approved");
  const rejected = all.filter((r) => r.status === "rejected");
  const meetings = (gatherings.data ?? []) as Gathering[];
  const notInMailerLite = people.filter((p) => !p.mailerlite_synced_at);

  const author = (r: PrayerRequest) => {
    const p = byUser.get(r.user_id);
    return p ? `${p.full_name}, ${p.country} · ${p.email}` : "Unknown member";
  };

  const RequestRow = ({ r, actions }: { r: PrayerRequest; actions: ("approve" | "reject")[] }) => {
    const p = byUser.get(r.user_id);
    return (
      <li id={`r-${r.id}`} className="scroll-mt-6 rounded-xl border border-line bg-paper p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <p className="text-navy">
            <span className="font-semibold">Shown as {prayerName(r)}</span>
            <span className="text-muted"> · {author(r)}</span>
          </p>
          <p className="text-muted">{shortDate(r.created_at)}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
          {r.reported_at && (
            <span className="rounded-full bg-danger-bg px-3 py-0.5 font-semibold text-danger">
              Reported{r.report_count > 1 ? ` ${r.report_count} times` : ""}
            </span>
          )}
          {r.approved_at && r.status !== "approved" && <span className="rounded-full bg-sand px-3 py-0.5 text-gold-text">Was on the wall</span>}
          {r.answered_at && <span className="rounded-full bg-sand px-3 py-0.5 text-gold-text">Answered 🙌</span>}
          {r.status === "approved" && <span className="rounded-full bg-sand px-3 py-0.5 text-gold-text">🙏 {r.prayed_count}</span>}
          {p?.is_banned && <span className="rounded-full bg-danger-bg px-3 py-0.5 text-danger">Author banned</span>}
        </div>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{r.body}</p>
        {r.answer_note && <p className="mt-2 whitespace-pre-line text-sm text-muted">Update: {r.answer_note}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {actions.includes("approve") && (
            <form action={approvePrayer}>
              <input type="hidden" name="id" value={r.id} />
              <button className={gold}>Approve</button>
            </form>
          )}
          {actions.includes("reject") && (
            <form action={rejectPrayer}>
              <input type="hidden" name="id" value={r.id} />
              <button className={small}>{r.status === "approved" ? "Take off the wall" : "Reject"}</button>
            </form>
          )}
          {sp.delete === r.id ? (
            <form action={deletePrayer} className="flex items-center gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="confirm" value="yes" />
              <button className={danger}>Yes, delete for good</button>
              <Link href={`/admin/community#r-${r.id}`} className="text-sm underline">
                Cancel
              </Link>
            </form>
          ) : (
            <form action={deletePrayer}>
              <input type="hidden" name="id" value={r.id} />
              <button className={small}>Delete</button>
            </form>
          )}
          {p && (
            <form action={setBanned}>
              <input type="hidden" name="user_id" value={p.user_id} />
              <input type="hidden" name="banned" value={p.is_banned ? "no" : "yes"} />
              <button className={`${small} ${p.is_banned ? "" : "text-danger"}`}>
                {p.is_banned ? "Allow posting again" : "Ban from posting"}
              </button>
            </form>
          )}
        </div>
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl text-navy" style={DISPLAY}>
        Community
      </h1>
      <p className="mt-2 text-muted">
        {people.length} joined · {pending.length} waiting for review · {approved.length} on the wall ·{" "}
        <Link href="/community/prayer" className="underline underline-offset-4">
          see the Prayer Wall
        </Link>
      </p>

      {sp.done && <p className="mt-6 rounded-xl border border-line bg-paper px-4 py-3 text-navy" role="status">{sp.done}</p>}
      {sp.error && <p className="mt-6 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-danger" role="alert">{sp.error}</p>}
      {loadError && <p className="mt-6 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-danger">Could not load everything: {loadError.message}</p>}

      <section id="review" className="mt-10 scroll-mt-6">
        <h2 className={H2} style={DISPLAY}>
          Waiting for review ({pending.length})
        </h2>
        <p className="mt-1 text-sm text-muted">New requests, and approved ones a member has reported. Nothing here is on the wall.</p>
        {pending.length === 0 ? (
          <p className="mt-4 text-muted">Nothing waiting.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((r) => (
              <RequestRow key={r.id} r={r} actions={["approve", "reject"]} />
            ))}
          </ul>
        )}
      </section>

      <section id="people" className="mt-14 scroll-mt-6">
        <h2 className={H2} style={DISPLAY}>
          People who joined ({people.length})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Newest first, with what each person wrote when they joined. You are also emailed each time someone joins.
          Members of the paid membership are in the community without joining, so they appear here once they add
          their details.
        </p>
        {people.length === 0 ? (
          <p className="mt-4 text-muted">No one yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {people.map((p) => (
              <li key={p.user_id} id={`m-${p.user_id}`} className="scroll-mt-6 rounded-xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg text-navy" style={DISPLAY}>
                    {p.full_name}
                  </p>
                  <p className="text-sm text-muted">Joined {shortDate(p.joined_at)}</p>
                </div>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  <dt className="text-muted">Email</dt>
                  <dd className="break-words">
                    <a href={`mailto:${p.email}`} className="text-gold-text underline underline-offset-4">
                      {p.email}
                    </a>
                  </dd>
                  <dt className="text-muted">Country</dt>
                  <dd>{p.country}</dd>
                  <dt className="text-muted">Phone</dt>
                  <dd>{p.phone ?? <span className="text-muted">Not given</span>}</dd>
                  <dt className="text-muted">MailerLite</dt>
                  <dd>{p.mailerlite_synced_at ? "Added" : <span className="font-semibold text-danger">Not added yet (see below)</span>}</dd>
                  <dt className="text-muted">Welcome email</dt>
                  <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {p.welcome_sent_at ? (
                      <span>Sent {shortDate(p.welcome_sent_at)}</span>
                    ) : p.welcome_error ? (
                      <span className="font-semibold text-danger">
                        Failed <span className="font-normal break-words">({p.welcome_error})</span>
                      </span>
                    ) : (
                      <span className="text-muted">Not sent (joined before welcome emails began)</span>
                    )}
                    {!p.welcome_sent_at && (
                      <form action={resendWelcome}>
                        <input type="hidden" name="user_id" value={p.user_id} />
                        <button className={small}>{p.welcome_error ? "Resend" : "Send"}</button>
                      </form>
                    )}
                  </dd>
                </dl>
                <p className="mt-3 text-[13px] uppercase tracking-[0.12em] text-gold-text">About them and why they joined</p>
                <p className="mt-1 whitespace-pre-line rounded-lg border-l-2 border-gold bg-cream px-3 py-2 leading-relaxed text-ink">
                  {p.join_message}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {p.is_banned && <span className="text-sm font-semibold text-danger">Banned from posting</span>}
                  <form action={setBanned}>
                    <input type="hidden" name="user_id" value={p.user_id} />
                    <input type="hidden" name="banned" value={p.is_banned ? "no" : "yes"} />
                    <button className={`${small} ${p.is_banned ? "" : "text-danger"}`}>
                      {p.is_banned ? "Allow posting again" : "Ban from posting"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {notInMailerLite.length > 0 && (
        <section id="mailerlite" className="mt-10 scroll-mt-6 rounded-xl border border-danger-line bg-danger-bg p-5">
          <h2 className="text-xl text-danger" style={DISPLAY}>
            Not in MailerLite yet ({notInMailerLite.length})
          </h2>
          <p className="mt-1 text-sm text-danger">
            They joined the community, but adding them to the &ldquo;Faithful Path Community&rdquo; group did not work
            (or has not finished yet, for someone who joined in the last minute).
          </p>
          <ul className="mt-3 space-y-2">
            {notInMailerLite.map((p) => (
              <li key={p.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                <p className="min-w-0 text-navy">
                  <span className="font-semibold">{p.full_name}</span> · {p.email}
                  <span className="block break-words text-[13px] text-danger">{p.mailerlite_error ?? "Not tried yet."}</span>
                </p>
                <form action={retryMailerLite}>
                  <input type="hidden" name="user_id" value={p.user_id} />
                  <button className={small}>Retry</button>
                </form>
              </li>
            ))}
          </ul>
          {notInMailerLite.length > 1 && (
            <form action={retryMailerLite} className="mt-3">
              <button className={gold}>Retry all</button>
            </form>
          )}
        </section>
      )}

      <section id="announcements" className="mt-14 scroll-mt-6">
        <h2 className={H2} style={DISPLAY}>
          Announcements
        </h2>
        <p className="mt-1 text-sm text-muted">
          Shown on the community home to signed-in members, pinned first, then newest first. Members see a
          &ldquo;New&rdquo; badge on ones posted since they last looked.
        </p>
        <div className="mt-4 rounded-xl border border-gold-line/60 bg-paper p-5">
          <h3 className="font-semibold text-navy">Write an announcement</h3>
          <div className="mt-3">
            <AnnouncementForm />
          </div>
        </div>
        {announcements.length > 0 && (
          <ul className="mt-4 space-y-3">
            {announcements.map((a) => (
              <li id={`a-${a.id}`} key={a.id} className="scroll-mt-6 rounded-xl border border-line bg-paper p-4">
                <p className="font-semibold text-navy">
                  {a.pinned && <span className="mr-2 text-gold-text">Pinned ·</span>}
                  {a.title} <span className="font-normal text-muted">· {shortDate(a.created_at)}</span>
                </p>
                <p className="mt-1 text-[13px]">
                  {a.emailed_at ? (
                    <span className="text-muted">Emailed {shortDate(a.emailed_at)}</span>
                  ) : a.email_error ? (
                    <span className="text-danger">Email not sent: {a.email_error}</span>
                  ) : (
                    <span className="text-muted">Not emailed</span>
                  )}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-gold-text">Edit</summary>
                  <div className="mt-3">
                    <AnnouncementForm a={a} />
                  </div>
                </details>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {a.email_error && !a.emailed_at && (
                    <form action={retryAnnouncementEmail}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className={small}>Retry the email</button>
                    </form>
                  )}
                  {sp.deleteAnnouncement === a.id ? (
                    <form action={deleteAnnouncement} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="confirm" value="yes" />
                      <button className={danger}>Yes, delete it</button>
                      <Link href="/admin/community#announcements" className="text-sm underline">
                        Cancel
                      </Link>
                    </form>
                  ) : (
                    <form action={deleteAnnouncement}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className={small}>Delete</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="gatherings" className="mt-14 scroll-mt-6">
        <h2 className={H2} style={DISPLAY}>
          Weekly Gathering
        </h2>
        <p className="mt-1 text-sm text-muted">
          Enter the time in Bangkok time. Members see it in their own time zone. With &ldquo;Repeats every
          week&rdquo; ticked, once a gathering ends it is shown again one week later at the same Bangkok time, with
          the same title, description and Zoom link, until you delete it or add a different gathering (the series
          then ends where the new one starts). &ldquo;Skip&rdquo; leaves out one week and keeps the series.
        </p>
        <div className="mt-4 rounded-xl border border-gold-line/60 bg-paper p-5">
          <h3 className="font-semibold text-navy">Add a gathering</h3>
          <div className="mt-3">
            <GatheringForm />
          </div>
        </div>
        {meetings.length > 0 && (
          <ul className="mt-4 space-y-3">
            {meetings.map((g) => (
              <li id={`g-${g.id}`} key={g.id} className="scroll-mt-6 rounded-xl border border-line bg-paper p-4">
                {(() => {
                  const dates = coming(g, meetings, g.repeats_weekly ? 5 : 1);
                  return (
                    <>
                      <p className="font-semibold text-navy">
                        {g.title}{" "}
                        <span className="font-normal text-muted">
                          · {g.repeats_weekly ? "every week from " : ""}
                          {bangkokLabel(g.starts_at)} Bangkok
                          {dates.length === 0 ? (g.repeats_weekly ? " · series ended" : " · past") : ""}
                        </span>
                      </p>
                      {g.repeats_weekly && dates.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[13px] uppercase tracking-[0.12em] text-gold-text">Coming weeks</p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {dates.map((o) => (
                              <li key={o.start}>
                                <form action={toggleSkipWeek} className="flex items-center gap-2 rounded-lg border border-line bg-cream px-3 py-1 text-sm">
                                  <input type="hidden" name="id" value={g.id} />
                                  <input type="hidden" name="date" value={bangkokDate(o.start)} />
                                  <span className={o.skipped ? "text-muted line-through" : "text-navy"}>{bangkokDay(o.start)}</span>
                                  <button className="min-h-9 text-[13px] font-semibold text-gold-text underline underline-offset-4">
                                    {o.skipped ? "Undo skip" : "Skip"}
                                  </button>
                                </form>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-gold-text">Edit</summary>
                  <div className="mt-3">
                    <GatheringForm g={g} />
                  </div>
                </details>
                <div className="mt-3">
                  {sp.deleteGathering === g.id ? (
                    <form action={deleteGathering} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={g.id} />
                      <input type="hidden" name="confirm" value="yes" />
                      <button className={danger}>Yes, delete it</button>
                      <Link href="/admin/community#gatherings" className="text-sm underline">
                        Cancel
                      </Link>
                    </form>
                  ) : (
                    <form action={deleteGathering}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className={small}>Delete</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="wall" className="mt-14 scroll-mt-6">
        <h2 className={H2} style={DISPLAY}>
          On the wall ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="mt-4 text-muted">Nothing on the wall yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {approved.map((r) => (
              <RequestRow key={r.id} r={r} actions={["reject"]} />
            ))}
          </ul>
        )}
      </section>

      {rejected.length > 0 && (
        <details className="mt-14">
          <summary className="cursor-pointer text-2xl text-navy" style={DISPLAY}>
            Rejected ({rejected.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {rejected.map((r) => (
              <RequestRow key={r.id} r={r} actions={["approve"]} />
            ))}
          </ul>
        </details>
      )}

    </main>
  );
}
