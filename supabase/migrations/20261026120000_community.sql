-- The free Faithful Path Community, Phase 1: profiles, the Prayer Wall, the
-- Weekly Gathering and announcements.
--
-- A community account grants nothing in the paid membership. Nothing here
-- writes to members, member_questions, course_purchases, products or any
-- payment table; members is only *read*, by community_is_member(), so that a
-- paying member counts as a community member without joining.
--
-- The app uses each person's own signed-in session for all of this, so these
-- policies are what decide who sees and changes what. The admin is the
-- info@faithfulpathcommunity.com account, by the same email rule as the
-- outreach table.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

/* ------------------------------------------------------------- who is who */

create or replace function public.community_is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com', false);
$$;

/* ---------------------------------------------------------------- profiles */

create table if not exists public.community_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  -- Copied from the sign-in at joining, so the admin list can say who is who.
  email      text not null,
  -- As typed on joining; sent to MailerLite. first_name is its first word,
  -- the only part shown on the Prayer Wall.
  full_name  text not null check (char_length(btrim(full_name)) between 1 and 80),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 40),
  country    text not null check (char_length(btrim(country)) between 2 and 60),
  -- Optional. Never shown to other members; for the admin only.
  phone      text check (phone is null or char_length(phone) <= 30),
  -- "Tell us a little about yourself and why you'd like to join", required,
  -- so Richmond can read and welcome each person himself.
  join_message text not null check (char_length(btrim(join_message)) between 1 and 500),
  joined_at  timestamptz not null default now(),
  is_banned  boolean not null default false,
  -- Adding them to the "Faithful Path Community" group in MailerLite. Joining
  -- never waits on it; a failure is kept here for the admin to retry.
  mailerlite_synced_at timestamptz,
  mailerlite_error     text
);

-- Someone may use the community if they have joined, or if they have a live
-- paid membership (active or trialing, as lib/members.ts isActive()). Security
-- definer so it can read members, which has no policies for signed-in users;
-- it only reads.
create or replace function public.community_is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and (
      exists (select 1 from public.community_profiles p where p.user_id = auth.uid())
      or exists (
        select 1 from public.members m
        where lower(m.email) = lower(auth.jwt() ->> 'email')
          and m.status in ('active', 'trialing')
      )
    );
$$;

-- What a member may change on their own profile: their name, country and
-- phone. Their joining message stays as they wrote it. The email, the joining
-- date, the ban and the MailerLite status are not theirs to set.
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
    else
      new.user_id   := old.user_id;
      new.email     := old.email;
      new.join_message := old.join_message;
      new.joined_at := old.joined_at;
      new.is_banned := old.is_banned;
      new.mailerlite_synced_at := old.mailerlite_synced_at;
      new.mailerlite_error     := old.mailerlite_error;
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

drop trigger if exists community_profiles_guard on public.community_profiles;
create trigger community_profiles_guard
  before insert or update on public.community_profiles
  for each row execute function public.community_profiles_guard();

alter table public.community_profiles enable row level security;

drop policy if exists "Own or admin reads profile"  on public.community_profiles;
drop policy if exists "Member adds own profile"     on public.community_profiles;
drop policy if exists "Own or admin updates profile" on public.community_profiles;
drop policy if exists "Own or admin deletes profile" on public.community_profiles;

create policy "Own or admin reads profile"
  on public.community_profiles for select to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

create policy "Member adds own profile"
  on public.community_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy "Own or admin updates profile"
  on public.community_profiles for update to authenticated
  using (user_id = auth.uid() or public.community_is_admin())
  with check (user_id = auth.uid() or public.community_is_admin());

create policy "Own or admin deletes profile"
  on public.community_profiles for delete to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

/* ----------------------------------------------------------- prayer wall */

create table if not exists public.prayer_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 1000),
  -- "Show my first name" or "Anonymous". The name is copied in when it is
  -- posted, because members cannot read each other's profiles.
  show_name     boolean not null default false,
  display_name  text,
  -- pending: waiting for the admin (new, or reported back); approved: on the
  -- wall; rejected: kept from the wall.
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  reported_at   timestamptz,
  report_count  integer not null default 0,
  prayed_count  integer not null default 0,
  answered_at   timestamptz,
  answer_note   text check (answer_note is null or char_length(answer_note) <= 500),
  approved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists prayer_requests_wall_idx
  on public.prayer_requests (status, created_at desc);
create index if not exists prayer_requests_user_idx
  on public.prayer_requests (user_id, created_at desc);

-- New requests: always pending, counted from zero, at most three a day
-- (Bangkok day, as the admin sees it), and never from a banned member.
-- Changes by a member: only marking it answered, with an optional update.
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
  new.answer_note  := nullif(btrim(coalesce(new.answer_note, '')), '');
  return new;
end;
$$;

drop trigger if exists prayer_requests_guard on public.prayer_requests;
create trigger prayer_requests_guard
  before insert or update on public.prayer_requests
  for each row execute function public.prayer_requests_guard();

alter table public.prayer_requests enable row level security;

drop policy if exists "Members read approved prayers" on public.prayer_requests;
drop policy if exists "Member adds prayer"            on public.prayer_requests;
drop policy if exists "Author or admin updates prayer" on public.prayer_requests;
drop policy if exists "Author or admin deletes prayer" on public.prayer_requests;

-- Approved requests for members; their own (waiting or not) for the author;
-- everything for the admin.
create policy "Members read approved prayers"
  on public.prayer_requests for select to authenticated
  using (
    (status = 'approved' and public.community_is_member())
    or user_id = auth.uid()
    or public.community_is_admin()
  );

create policy "Member adds prayer"
  on public.prayer_requests for insert to authenticated
  with check (user_id = auth.uid() and public.community_is_member());

create policy "Author or admin updates prayer"
  on public.prayer_requests for update to authenticated
  using (user_id = auth.uid() or public.community_is_admin())
  with check (user_id = auth.uid() or public.community_is_admin());

create policy "Author or admin deletes prayer"
  on public.prayer_requests for delete to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

/* ------------------------------------------------------- "I prayed" taps */

create table if not exists public.prayer_prayed (
  request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

-- Keeps prayed_count in step. Security definer: the member may not update
-- someone else's request themselves.
create or replace function public.prayer_prayed_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.prayer_requests set prayed_count = prayed_count + 1 where id = new.request_id;
  return new;
end;
$$;

drop trigger if exists prayer_prayed_count on public.prayer_prayed;
create trigger prayer_prayed_count
  after insert on public.prayer_prayed
  for each row execute function public.prayer_prayed_count();

alter table public.prayer_prayed enable row level security;

drop policy if exists "Own or admin reads prayed" on public.prayer_prayed;
drop policy if exists "Member prays"              on public.prayer_prayed;

-- Who prayed for what is not shown to anyone but the person themselves.
create policy "Own or admin reads prayed"
  on public.prayer_prayed for select to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

create policy "Member prays"
  on public.prayer_prayed for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.community_is_member()
    and exists (select 1 from public.prayer_requests r where r.id = request_id and r.status = 'approved')
  );

/* ----------------------------------------------------------------- reports */

create table if not exists public.prayer_reports (
  request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

-- A report takes the request off the wall and back to the admin's review list.
create or replace function public.prayer_reports_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.prayer_requests
     set status = 'pending', reported_at = now(), report_count = report_count + 1
   where id = new.request_id;
  return new;
end;
$$;

drop trigger if exists prayer_reports_apply on public.prayer_reports;
create trigger prayer_reports_apply
  after insert on public.prayer_reports
  for each row execute function public.prayer_reports_apply();

alter table public.prayer_reports enable row level security;

drop policy if exists "Own or admin reads reports" on public.prayer_reports;
drop policy if exists "Member reports"             on public.prayer_reports;

create policy "Own or admin reads reports"
  on public.prayer_reports for select to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

create policy "Member reports"
  on public.prayer_reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.community_is_member()
    and not exists (select 1 from public.community_profiles p where p.user_id = auth.uid() and p.is_banned)
    and exists (select 1 from public.prayer_requests r where r.id = request_id and r.status = 'approved')
  );

/* --------------------------------------------------------- leaving */

-- "Leave the community": removes the person's profile, their prayer requests
-- and their taps and reports. (Their MailerLite entry is removed by the app.) Their sign-in, and any paid membership, are not
-- touched.
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
  delete from public.prayer_prayed      where user_id = auth.uid();
  delete from public.prayer_reports     where user_id = auth.uid();
  delete from public.prayer_requests    where user_id = auth.uid();
  delete from public.community_seen     where user_id = auth.uid();
  delete from public.community_profiles where user_id = auth.uid();
end;
$$;

/* ------------------------------------------------------- weekly gathering */

create table if not exists public.community_gatherings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  starts_at   timestamptz not null,
  zoom_url    text not null check (zoom_url ~ '^https://'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists community_gatherings_starts_idx
  on public.community_gatherings (starts_at);

create or replace function public.community_gatherings_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists community_gatherings_touch on public.community_gatherings;
create trigger community_gatherings_touch
  before update on public.community_gatherings
  for each row execute function public.community_gatherings_touch();

alter table public.community_gatherings enable row level security;

drop policy if exists "Members read gatherings" on public.community_gatherings;
drop policy if exists "Admin adds gatherings"   on public.community_gatherings;
drop policy if exists "Admin updates gatherings" on public.community_gatherings;
drop policy if exists "Admin deletes gatherings" on public.community_gatherings;

create policy "Members read gatherings"
  on public.community_gatherings for select to authenticated
  using (public.community_is_member() or public.community_is_admin());

create policy "Admin adds gatherings"
  on public.community_gatherings for insert to authenticated
  with check (public.community_is_admin());

create policy "Admin updates gatherings"
  on public.community_gatherings for update to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

create policy "Admin deletes gatherings"
  on public.community_gatherings for delete to authenticated
  using (public.community_is_admin());

/* ----------------------------------------------------------- announcements */

create table if not exists public.community_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 150),
  -- Markdown.
  body        text not null check (char_length(body) between 1 and 10000),
  link_label  text check (link_label is null or char_length(link_label) <= 60),
  link_url    text check (link_url is null or link_url ~ '^(https://|/)'),
  pinned      boolean not null default false,
  -- "Also email this to the community", through MailerLite.
  emailed_at  timestamptz,
  email_error text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists community_announcements_order_idx
  on public.community_announcements (pinned desc, created_at desc);

drop trigger if exists community_announcements_touch on public.community_announcements;
create trigger community_announcements_touch
  before update on public.community_announcements
  for each row execute function public.community_gatherings_touch();

alter table public.community_announcements enable row level security;

drop policy if exists "Members read announcements"   on public.community_announcements;
drop policy if exists "Admin adds announcements"     on public.community_announcements;
drop policy if exists "Admin updates announcements"  on public.community_announcements;
drop policy if exists "Admin deletes announcements"  on public.community_announcements;

create policy "Members read announcements"
  on public.community_announcements for select to authenticated
  using (public.community_is_member() or public.community_is_admin());

create policy "Admin adds announcements"
  on public.community_announcements for insert to authenticated
  with check (public.community_is_admin());

create policy "Admin updates announcements"
  on public.community_announcements for update to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

create policy "Admin deletes announcements"
  on public.community_announcements for delete to authenticated
  using (public.community_is_admin());

-- When each person last looked at the announcements, for the "New" badge.
-- One row per person; paying members without a profile have one too.
create table if not exists public.community_seen (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  announcements_seen_at timestamptz not null default now()
);

alter table public.community_seen enable row level security;

drop policy if exists "Own seen row" on public.community_seen;
create policy "Own seen row"
  on public.community_seen for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

/* ------------------------------------------------------------------ access */

-- Nothing for signed-out visitors. Signed-in users get only what the
-- policies above allow.
revoke all on public.community_profiles   from anon, authenticated;
revoke all on public.prayer_requests      from anon, authenticated;
revoke all on public.prayer_prayed        from anon, authenticated;
revoke all on public.prayer_reports       from anon, authenticated;
revoke all on public.community_gatherings from anon, authenticated;
revoke all on public.community_announcements from anon, authenticated;
revoke all on public.community_seen          from anon, authenticated;

grant select, insert, update, delete on public.community_profiles   to authenticated;
grant select, insert, update, delete on public.prayer_requests      to authenticated;
grant select, insert                 on public.prayer_prayed        to authenticated;
grant select, insert                 on public.prayer_reports       to authenticated;
grant select, insert, update, delete on public.community_gatherings to authenticated;
grant select, insert, update, delete on public.community_announcements to authenticated;
grant select, insert, update, delete on public.community_seen          to authenticated;

revoke all on function public.community_is_member() from public, anon;
revoke all on function public.community_leave()     from public, anon;
grant execute on function public.community_is_admin()  to authenticated;
grant execute on function public.community_is_member() to authenticated;
grant execute on function public.community_leave()     to authenticated;

commit;
