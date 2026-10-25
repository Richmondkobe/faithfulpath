-- Community Guidelines and Ask Pastor Richmond (Richmond, 26 October 2026).
--
-- 1. Guidelines: the date each member agreed (community_profiles
--    .guidelines_agreed_at), and Richmond's "Remove member", which deletes a
--    member's community profile and posts and keeps their email address on a
--    short list (community_removed_emails) so the same address cannot rejoin.
--    Removing someone never reads or writes members, purchases,
--    course_purchases, gifts or ministry_partners. A removed paying member
--    keeps their membership and courses; only the free community is closed to
--    them.
--
-- 2. Ask Pastor Richmond: members' questions (community_questions), each
--    pending until Richmond publishes an answer or declines it, at most two
--    per member in any seven days; and reports (community_question_reports),
--    which send an answered question back to his review list.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

/* ---------------------------------------------------------- guidelines */

alter table public.community_profiles
  add column if not exists guidelines_agreed_at timestamptz;

create or replace function public.community_profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.community_is_admin() then
    if tg_op = 'INSERT' then
      new.email     := lower(auth.jwt() ->> 'email');
      new.joined_at := now();
      new.is_banned := false;
      new.mailerlite_synced_at := null;
      new.mailerlite_error     := null;
      new.welcome_sent_at      := null;
      new.welcome_error        := null;
      -- Agreed to the guidelines: stamped now if they ticked the box.
      new.guidelines_agreed_at := case when new.guidelines_agreed_at is not null then now() else null end;
    else
      new.user_id   := old.user_id;
      new.email     := old.email;
      new.join_message := old.join_message;
      new.joined_at := old.joined_at;
      new.is_banned := old.is_banned;
      new.mailerlite_synced_at := old.mailerlite_synced_at;
      new.mailerlite_error     := old.mailerlite_error;
      new.welcome_sent_at      := old.welcome_sent_at;
      new.welcome_error        := old.welcome_error;
      -- Agreeing later (members who joined before the guidelines): once.
      new.guidelines_agreed_at := case
        when old.guidelines_agreed_at is null and new.guidelines_agreed_at is not null then now()
        else old.guidelines_agreed_at end;
    end if;
  end if;
  new.full_name  := btrim(new.full_name);
  new.first_name := btrim(new.first_name);
  new.country    := btrim(new.country);
  new.phone      := nullif(btrim(coalesce(new.phone, '')), '');
  new.join_message := btrim(new.join_message);
  return new;
end;
$$;

create table if not exists public.community_removed_emails (
  email      text primary key,
  removed_at timestamptz not null default now()
);

alter table public.community_removed_emails enable row level security;
drop policy if exists "Admin manages removed emails" on public.community_removed_emails;
create policy "Admin manages removed emails"
  on public.community_removed_emails for all to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());
revoke all on public.community_removed_emails from anon, authenticated;
grant select, insert, delete on public.community_removed_emails to authenticated;

-- Whether the signed-in person's address has been removed from the
-- community. Security definer: members cannot read the list itself.
create or replace function public.community_is_removed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_removed_emails r
    where r.email = lower(auth.jwt() ->> 'email')
  );
$$;

-- As before, but never for a removed address (a removed paying member keeps
-- the membership, not the community).
create or replace function public.community_is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and not public.community_is_removed()
    and (
      exists (select 1 from public.community_profiles p where p.user_id = auth.uid())
      or exists (
        select 1 from public.members m
        where lower(m.email) = lower(auth.jwt() ->> 'email')
          and m.status in ('active', 'trialing')
      )
    );
$$;

-- A removed address cannot join again.
drop policy if exists "Member adds own profile" on public.community_profiles;
create policy "Member adds own profile"
  on public.community_profiles for insert to authenticated
  with check (user_id = auth.uid() and not public.community_is_removed());

/* ------------------------------------------------- ask pastor richmond */

create table if not exists public.community_questions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 1000),
  show_name     boolean not null default false,
  display_name  text,
  -- pending: waiting for Richmond (new, or reported back); published:
  -- answered and shown; declined: not answered, never shown.
  status        text not null default 'pending' check (status in ('pending', 'published', 'declined')),
  answer        text check (answer is null or char_length(answer) <= 10000),
  decline_note  text check (decline_note is null or char_length(decline_note) <= 2000),
  reported_at   timestamptz,
  report_count  integer not null default 0,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists community_questions_status_idx on public.community_questions (status, published_at desc);
create index if not exists community_questions_user_idx on public.community_questions (user_id, created_at desc);

-- New questions: always pending, name copied in if asked, at most two in any
-- seven days, never from a banned member or one without a profile. Members
-- cannot change a question once asked.
create or replace function public.community_questions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  prof public.community_profiles;
begin
  if current_user not in ('authenticated', 'anon') or public.community_is_admin() then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    raise exception 'A question cannot be changed once it is asked.' using errcode = 'P0001';
  end if;
  select * into prof from public.community_profiles where user_id = auth.uid();
  if prof.user_id is null then
    raise exception 'Add your details on the community home before asking.' using errcode = 'P0001';
  end if;
  if prof.is_banned then
    raise exception 'Asking questions is closed on this account.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.community_questions q
      where q.user_id = auth.uid() and q.created_at >= now() - interval '7 days') >= 2 then
    raise exception 'You have asked two questions this week. You can ask another once a week has passed since the first.' using errcode = 'P0001';
  end if;
  new.user_id      := auth.uid();
  new.body         := btrim(new.body);
  new.display_name := case when new.show_name then prof.first_name else null end;
  new.status       := 'pending';
  new.answer       := null;
  new.decline_note := null;
  new.reported_at  := null;
  new.report_count := 0;
  new.published_at := null;
  new.created_at   := now();
  return new;
end;
$$;

drop trigger if exists community_questions_guard on public.community_questions;
create trigger community_questions_guard
  before insert or update on public.community_questions
  for each row execute function public.community_questions_guard();

alter table public.community_questions enable row level security;

drop policy if exists "Members read published questions" on public.community_questions;
drop policy if exists "Member asks"                      on public.community_questions;
drop policy if exists "Admin updates questions"          on public.community_questions;
drop policy if exists "Author or admin deletes question" on public.community_questions;

-- Published ones for members; their own (with any decline note) for the
-- author; everything for the admin.
create policy "Members read published questions"
  on public.community_questions for select to authenticated
  using (
    (status = 'published' and public.community_is_member())
    or user_id = auth.uid()
    or public.community_is_admin()
  );

create policy "Member asks"
  on public.community_questions for insert to authenticated
  with check (user_id = auth.uid() and public.community_is_member());

create policy "Admin updates questions"
  on public.community_questions for update to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

create policy "Author or admin deletes question"
  on public.community_questions for delete to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

create table if not exists public.community_question_reports (
  question_id uuid not null references public.community_questions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (question_id, user_id)
);

-- A report takes the question off the board and back to Richmond's review list.
create or replace function public.community_question_reports_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.community_questions
     set status = 'pending', reported_at = now(), report_count = report_count + 1
   where id = new.question_id;
  return new;
end;
$$;

drop trigger if exists community_question_reports_apply on public.community_question_reports;
create trigger community_question_reports_apply
  after insert on public.community_question_reports
  for each row execute function public.community_question_reports_apply();

alter table public.community_question_reports enable row level security;

drop policy if exists "Own or admin reads question reports" on public.community_question_reports;
drop policy if exists "Member reports a question"           on public.community_question_reports;

create policy "Own or admin reads question reports"
  on public.community_question_reports for select to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

create policy "Member reports a question"
  on public.community_question_reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.community_is_member()
    and not exists (select 1 from public.community_profiles p where p.user_id = auth.uid() and p.is_banned)
    and exists (select 1 from public.community_questions q where q.id = question_id and q.status = 'published')
  );

revoke all on public.community_questions        from anon, authenticated;
revoke all on public.community_question_reports from anon, authenticated;
grant select, insert, update, delete on public.community_questions        to authenticated;
grant select, insert                 on public.community_question_reports to authenticated;

/* ------------------------------------------------- leaving and removing */

-- Leaving now also removes the person's questions and question reports.
create or replace function public.community_leave()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  delete from public.prayer_prayed              where user_id = auth.uid();
  delete from public.prayer_reports             where user_id = auth.uid();
  delete from public.prayer_requests            where user_id = auth.uid();
  delete from public.community_question_reports where user_id = auth.uid();
  delete from public.community_questions        where user_id = auth.uid();
  delete from public.community_seen             where user_id = auth.uid();
  delete from public.community_profiles         where user_id = auth.uid();
end;
$$;

-- Richmond's "Remove member": the address goes on the removed list, and the
-- member's community profile, prayer requests (with their answers), taps,
-- reports and questions are deleted. Only community tables are touched; the
-- sign-in itself, and any membership, purchase or gift, are left alone.
create or replace function public.community_remove_member(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  addr text;
begin
  if not public.community_is_admin() then
    raise exception 'Only Pastor Richmond can remove a member.';
  end if;
  select lower(email) into addr from public.community_profiles where user_id = target;
  if addr is null then
    select lower(email) into addr from auth.users where id = target;
  end if;
  if addr is null then
    raise exception 'That member was not found.';
  end if;
  if addr = 'info@faithfulpathcommunity.com' then
    raise exception 'The admin account cannot be removed.';
  end if;
  insert into public.community_removed_emails (email) values (addr) on conflict (email) do nothing;
  delete from public.prayer_prayed              where user_id = target;
  delete from public.prayer_reports             where user_id = target;
  delete from public.prayer_requests            where user_id = target;
  delete from public.community_question_reports where user_id = target;
  delete from public.community_questions        where user_id = target;
  delete from public.community_seen             where user_id = target;
  delete from public.community_profiles         where user_id = target;
  return addr;
end;
$$;

revoke all on function public.community_is_removed()           from public, anon;
revoke all on function public.community_remove_member(uuid)     from public, anon;
grant execute on function public.community_is_removed()         to authenticated;
grant execute on function public.community_remove_member(uuid)  to authenticated;

commit;
