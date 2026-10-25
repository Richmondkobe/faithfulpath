-- Answered Prayers (Richmond, 26 October 2026).
--
-- When a member marks their own request "Answered", they may add a short
-- praise update and choose to share it on /community/answered. The update is
-- kept in its own table, prayer_answers, so that one Richmond has not yet
-- approved cannot be read by other members at all, not just hidden by the
-- page. An answer with no update has nothing new to review and is shown
-- straight away; one with an update waits for Richmond. He can hide any
-- answered prayer from the page.
--
-- Also redefines the request guard so a request can be marked answered only
-- once and its old answer_note column can no longer be written by members
-- (it is unused from now on; there are no rows with one).
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

create table if not exists public.prayer_answers (
  request_id  uuid primary key references public.prayer_requests (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- The praise update, optional.
  note        text check (note is null or char_length(note) <= 500),
  -- "Share this on the Answered Prayers page".
  share       boolean not null default true,
  -- pending: an update waiting for Richmond; approved: shown; hidden: kept
  -- off the page (and the update off the Prayer Wall) by Richmond.
  status      text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists prayer_answers_page_idx on public.prayer_answers (status, created_at desc);

-- A member adds their own answer once; the status is decided here, not by them.
create or replace function public.prayer_answers_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.community_is_admin() then
    if tg_op = 'UPDATE' then
      raise exception 'Only Pastor Richmond can change an answered prayer.' using errcode = 'P0001';
    end if;
    new.user_id     := auth.uid();
    new.note        := nullif(btrim(coalesce(new.note, '')), '');
    new.status      := case when new.note is null then 'approved' else 'pending' end;
    new.created_at  := now();
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists prayer_answers_guard on public.prayer_answers;
create trigger prayer_answers_guard
  before insert or update on public.prayer_answers
  for each row execute function public.prayer_answers_guard();

alter table public.prayer_answers enable row level security;

drop policy if exists "Members read approved answers" on public.prayer_answers;
drop policy if exists "Author adds answer"            on public.prayer_answers;
drop policy if exists "Admin updates answers"         on public.prayer_answers;
drop policy if exists "Admin deletes answers"         on public.prayer_answers;

-- Approved answers to requests that are on the wall, for members; their own
-- (waiting or not) for the author; everything for the admin.
create policy "Members read approved answers"
  on public.prayer_answers for select to authenticated
  using (
    (status = 'approved' and public.community_is_member()
      and exists (select 1 from public.prayer_requests r where r.id = request_id and r.status = 'approved'))
    or user_id = auth.uid()
    or public.community_is_admin()
  );

create policy "Author adds answer"
  on public.prayer_answers for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.prayer_requests r
      where r.id = request_id and r.user_id = auth.uid() and r.status = 'approved' and r.answered_at is not null
    )
  );

create policy "Admin updates answers"
  on public.prayer_answers for update to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

create policy "Admin deletes answers"
  on public.prayer_answers for delete to authenticated
  using (public.community_is_admin());

revoke all on public.prayer_answers from anon, authenticated;
grant select, insert, update, delete on public.prayer_answers to authenticated;

create or replace function public.prayer_requests_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  prof public.community_profiles;
  today_start timestamptz := date_trunc('day', now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok';
begin
  if current_user not in ('authenticated', 'anon') or public.community_is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select * into prof from public.community_profiles where user_id = auth.uid();
    if prof.user_id is null then
      raise exception 'Add your first name and country before posting.' using errcode = 'P0001';
    end if;
    if prof.is_banned then
      raise exception 'Posting is closed on this account.' using errcode = 'P0001';
    end if;
    if (select count(*) from public.prayer_requests r
        where r.user_id = auth.uid() and r.created_at >= today_start) >= 3 then
      raise exception 'You have shared three prayer requests today. You can share another tomorrow.' using errcode = 'P0001';
    end if;
    new.user_id      := auth.uid();
    new.body         := btrim(new.body);
    new.display_name := case when new.show_name then prof.first_name else null end;
    new.status       := 'pending';
    new.reported_at  := null;
    new.report_count := 0;
    new.prayed_count := 0;
    new.answered_at  := null;
    new.answer_note  := null;
    new.approved_at  := null;
    new.created_at   := now();
    return new;
  end if;

  -- UPDATE by the author: everything stays as it was except the answer.
  new.id           := old.id;
  new.user_id      := old.user_id;
  new.body         := old.body;
  new.show_name    := old.show_name;
  new.display_name := old.display_name;
  new.status       := old.status;
  new.reported_at  := old.reported_at;
  new.report_count := old.report_count;
  new.prayed_count := old.prayed_count;
  new.approved_at  := old.approved_at;
  new.created_at   := old.created_at;
  -- Marked answered once, at the time it is marked; never unmarked or moved.
  -- The praise update lives in prayer_answers, where it waits for review.
  new.answered_at  := case when old.answered_at is null and new.answered_at is not null then now() else old.answered_at end;
  new.answer_note  := old.answer_note;
  return new;
end;
$$;

commit;
