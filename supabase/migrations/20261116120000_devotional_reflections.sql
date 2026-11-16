-- Faithful Path Daily Devotional: members' reflections (Richmond, 16 November 2026).
--
-- A member can write a short reflection under the day's devotion. Like a
-- prayer request, each one is pending until Richmond approves it, shows the
-- member's first name, and can be removed by its author or by Richmond. At
-- most three a day per member, never from a banned member or one without a
-- community profile. A member's reflections are deleted when their community
-- profile is (leaving, or "Remove member").
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

create table if not exists public.devotional_reflections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  -- Which day of the series it was written under: days since the series
  -- began (0 = the first day), so a later run of the same devotion starts
  -- with no reflections.
  day_seq       integer not null check (day_seq >= 0),
  body          text not null check (char_length(btrim(body)) between 1 and 1000),
  display_name  text not null,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists devotional_reflections_day_idx  on public.devotional_reflections (day_seq, status, created_at);
create index if not exists devotional_reflections_user_idx on public.devotional_reflections (user_id, created_at desc);

create or replace function public.devotional_reflections_guard()
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
    raise exception 'A reflection cannot be changed once it is shared.' using errcode = 'P0001';
  end if;
  select * into prof from public.community_profiles where user_id = auth.uid();
  if prof.user_id is null then
    raise exception 'Add your name and country on the community home before sharing.' using errcode = 'P0001';
  end if;
  if prof.is_banned then
    raise exception 'Posting is closed on this account.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.devotional_reflections r
      where r.user_id = auth.uid() and r.created_at >= now() - interval '24 hours') >= 3 then
    raise exception 'You have shared three reflections today. You can share another tomorrow.' using errcode = 'P0001';
  end if;
  new.user_id      := auth.uid();
  new.body         := btrim(new.body);
  new.display_name := prof.first_name;
  new.status       := 'pending';
  new.approved_at  := null;
  new.created_at   := now();
  return new;
end;
$$;

drop trigger if exists devotional_reflections_guard on public.devotional_reflections;
create trigger devotional_reflections_guard
  before insert or update on public.devotional_reflections
  for each row execute function public.devotional_reflections_guard();

alter table public.devotional_reflections enable row level security;

drop policy if exists "Members read approved reflections"  on public.devotional_reflections;
drop policy if exists "Member shares a reflection"         on public.devotional_reflections;
drop policy if exists "Admin updates reflections"          on public.devotional_reflections;
drop policy if exists "Author or admin deletes reflection" on public.devotional_reflections;

create policy "Members read approved reflections"
  on public.devotional_reflections for select to authenticated
  using (
    (status = 'approved' and public.community_is_member())
    or user_id = auth.uid()
    or public.community_is_admin()
  );

create policy "Member shares a reflection"
  on public.devotional_reflections for insert to authenticated
  with check (user_id = auth.uid() and public.community_is_member());

create policy "Admin updates reflections"
  on public.devotional_reflections for update to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

create policy "Author or admin deletes reflection"
  on public.devotional_reflections for delete to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

revoke all on public.devotional_reflections from anon, authenticated;
grant select, insert, update, delete on public.devotional_reflections to authenticated;

-- Leaving the community, or being removed from it, deletes the profile; the
-- member's reflections go with it.
create or replace function public.devotional_reflections_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.devotional_reflections where user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists devotional_reflections_cleanup on public.community_profiles;
create trigger devotional_reflections_cleanup
  after delete on public.community_profiles
  for each row execute function public.devotional_reflections_cleanup();

commit;
