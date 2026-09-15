-- The 30-Day Mind-Renewal Journey: one row per member per day.
--
-- Kept in its own table rather than in course_progress because the manifest
-- requires it: modules.m5.status_config.progress_stored_separately_from_foundation.
-- The journey is not part of the foundation course's completion, and a day
-- carries two independent facts that course_progress has nowhere to put —
-- whether the page has been opened, and which of four statuses the member chose.
--
-- Opening a day records a visit. It never completes anything. Progress is
-- reported as "x of 30 days visited", which is a count of rows here, not of
-- statuses: a member who opens a day and chooses nothing has still visited it.
--
-- Written by the member themselves, so — like course_progress and
-- course_reflections — the app uses the cookie-backed anon client and RLS on
-- auth.uid() does the authorising.

begin;

create table if not exists public.course_day_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  day        integer not null,
  -- Set when the page is first opened, and never moved afterwards: the count
  -- the member sees is of days reached, not of days revisited.
  visited_at timestamptz not null default now(),
  -- Null is a real state: the day has been opened and no status chosen. It is
  -- also what clearing a status returns to.
  --
  -- 'need_support' deliberately does not complete a day, and nothing anywhere
  -- notifies anyone that it was chosen. Writing that you need help alerts no
  -- one; the pages say so, and there is no alerting to build.
  status     text,
  status_at  timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, course_slug, day),
  constraint course_day_progress_day_check check (day between 1 and 30),
  constraint course_day_progress_status_check check (
    status is null or status in ('complete', 'skip', 'not_appropriate', 'need_support')
  )
);

-- The journey home reads a member's whole journey at once.
create index if not exists course_day_progress_user_course_idx
  on public.course_day_progress (user_id, course_slug, day);

-- Defined here as well as in the course_progress migration. `create or replace`
-- makes that harmless if it already exists, and it means this file does not
-- silently depend on another migration having been applied first — the whole
-- file is one transaction, so that dependency failing would roll back the table
-- along with it.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists course_day_progress_touch_updated_at on public.course_day_progress;
create trigger course_day_progress_touch_updated_at
  before update on public.course_day_progress
  for each row execute function public.touch_updated_at();

alter table public.course_day_progress enable row level security;

-- Select, insert and update only your own rows, exactly as course_progress
-- does. `with check` on insert and update is what stops a member writing a row
-- under someone else's user_id. No delete policy: clearing a status is an
-- update to null, not a deletion, so a visit is never un-recorded.
drop policy if exists "Members read their own day progress"   on public.course_day_progress;
drop policy if exists "Members insert their own day progress" on public.course_day_progress;
drop policy if exists "Members update their own day progress" on public.course_day_progress;

create policy "Members read their own day progress"
  on public.course_day_progress for select to authenticated
  using (user_id = auth.uid());

create policy "Members insert their own day progress"
  on public.course_day_progress for insert to authenticated
  with check (user_id = auth.uid());

create policy "Members update their own day progress"
  on public.course_day_progress for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Signed-out visitors get nothing at all.
revoke all on public.course_day_progress from anon;
grant select, insert, update on public.course_day_progress to authenticated;

commit;
