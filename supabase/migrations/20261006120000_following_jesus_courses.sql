-- Following Jesus: the four video courses sold on their own, outside the
-- membership. Begin is the first; Establish, Grow and Multiply follow, and use
-- these same three tables.
--
-- Lesson completion is not here. It goes in course_progress, which already
-- keeps each person to their own rows; the course_slug is 'following-jesus-begin'
-- and so on.
--
-- Nothing in this file alters an existing table, row or policy.

begin;

/* ------------------------------------------------------------- purchases */

-- One row per paid Checkout Session for a Following Jesus offer. Written only
-- by the Stripe webhook (and the thank-you page, in case it beats the webhook)
-- under the service-role key, exactly as members is.
--
-- Matched to the login by email, because people pay before they ever sign in.
-- What an offer unlocks lives in the app (lib/following-jesus.ts), not here:
-- the all-four bundle opens each later course when it launches, so the row has
-- to record what was bought, not a list of courses fixed on the day.
create table if not exists public.course_purchases (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  offer             text not null,
  amount_cents      integer not null default 0,
  stripe_session_id text not null unique,
  created_at        timestamptz not null default now(),
  constraint course_purchases_offer_check check (offer in (
    'following-jesus-begin',
    'following-jesus-all-four'
  ))
);

create index if not exists course_purchases_email_idx
  on public.course_purchases (lower(email));

alter table public.course_purchases enable row level security;

-- Read-only, and only your own rows. No insert, update or delete policy: no
-- browser can create or alter a purchase.
drop policy if exists "Buyers read their own course purchases" on public.course_purchases;
create policy "Buyers read their own course purchases"
  on public.course_purchases for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

revoke all on public.course_purchases from anon;
revoke insert, update, delete on public.course_purchases from authenticated;
grant select on public.course_purchases to authenticated;

/* ----------------------------------------------------------- completions */

-- One row per person per course finished: the record that they completed it,
-- and when. The Multiply completion page will read this to show its line to
-- people who have completed all four.
--
-- Written by the server under the service-role key, and only after it has
-- counted every lesson of that course as complete in course_progress. There is
-- no insert policy, so a completion cannot be written from a browser.
create table if not exists public.course_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_slug  text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, course_slug)
);

alter table public.course_completions enable row level security;

drop policy if exists "Learners read their own completions" on public.course_completions;
create policy "Learners read their own completions"
  on public.course_completions for select to authenticated
  using (user_id = auth.uid());

revoke all on public.course_completions from anon;
revoke insert, update, delete on public.course_completions from authenticated;
grant select on public.course_completions to authenticated;

/* ------------------------------------------------------- private answers */

-- What a learner writes or ticks on a course page: the lesson text boxes and
-- reading plans, and the My First Steps completion page.
--
-- The completion page promises these are private, so:
--   * each person can read and change only their own rows (RLS on auth.uid());
--   * the app reads and writes them only through the person's own session,
--     never the service-role key;
--   * no admin page shows them, and nothing emails them, sends them to
--     analytics, or shares them with a group or another learner.
-- Keep it that way. Anything that wants to read this table for someone other
-- than the signed-in person is breaking a promise printed on the page.
create table if not exists public.course_private_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  -- 'lesson-01' … 'lesson-08', or 'my-first-steps'.
  page_slug   text not null,
  -- Which box on the page: 'text-3', 'plan-5', 'r1' and so on.
  field_key   text not null,
  value       text not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, course_slug, page_slug, field_key),
  constraint course_private_answers_slug_check check (
    course_slug ~ '^[a-z0-9-]{1,64}$' and page_slug ~ '^[a-z0-9-]{1,64}$'
  ),
  constraint course_private_answers_key_check check (field_key ~ '^[a-z0-9-]{1,32}$'),
  -- Generous for a reflection, but a ceiling all the same.
  constraint course_private_answers_value_check check (char_length(value) <= 20000)
);

create index if not exists course_private_answers_user_page_idx
  on public.course_private_answers (user_id, course_slug, page_slug);

-- Defined in earlier migrations too; see the note in course_day_progress.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists course_private_answers_touch_updated_at on public.course_private_answers;
create trigger course_private_answers_touch_updated_at
  before update on public.course_private_answers
  for each row execute function public.touch_updated_at();

alter table public.course_private_answers enable row level security;

drop policy if exists "Learners read their own answers"   on public.course_private_answers;
drop policy if exists "Learners insert their own answers" on public.course_private_answers;
drop policy if exists "Learners update their own answers" on public.course_private_answers;
drop policy if exists "Learners delete their own answers" on public.course_private_answers;

create policy "Learners read their own answers"
  on public.course_private_answers for select to authenticated
  using (user_id = auth.uid());

create policy "Learners insert their own answers"
  on public.course_private_answers for insert to authenticated
  with check (user_id = auth.uid());

create policy "Learners update their own answers"
  on public.course_private_answers for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Learners delete their own answers"
  on public.course_private_answers for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.course_private_answers from anon;
grant select, insert, update, delete on public.course_private_answers to authenticated;

-- Supabase also grants truncate, references and trigger to `authenticated` by
-- default. None is reachable through the API, but truncate ignores RLS, so on
-- these three tables it is not held at all.
revoke truncate, references, trigger on public.course_purchases       from authenticated;
revoke truncate, references, trigger on public.course_completions     from authenticated;
revoke truncate, references, trigger on public.course_private_answers from authenticated;

commit;
