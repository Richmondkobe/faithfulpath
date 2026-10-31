-- Pastor's reply on the Prayer Wall (Richmond, 31 October 2026).
--
-- Richmond can write a short reply (up to 600 characters) under any request
-- on the wall. It is shown to members under the request, headed "Pastor
-- Richmond replied", with the date.
--
-- Two new columns on prayer_requests. The RLS policies are unchanged; the
-- request guard is redefined so that only the admin can write them: a member
-- posting a request starts with no reply, and a member changing their own
-- request (marking it answered) cannot set, change or remove one.
--
-- No existing request is changed: every row simply starts with no reply.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

alter table public.prayer_requests
  add column if not exists pastor_reply text,
  add column if not exists pastor_replied_at timestamptz;

alter table public.prayer_requests
  drop constraint if exists prayer_requests_pastor_reply_check;
alter table public.prayer_requests
  add constraint prayer_requests_pastor_reply_check
  check (pastor_reply is null or char_length(btrim(pastor_reply)) between 1 and 600);

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
    new.user_id           := auth.uid();
    new.body              := btrim(new.body);
    new.display_name      := case when new.show_name then prof.first_name else null end;
    new.status            := 'pending';
    new.reported_at       := null;
    new.report_count      := 0;
    new.prayed_count      := 0;
    new.answered_at       := null;
    new.approved_at       := null;
    new.pastor_reply      := null;
    new.pastor_replied_at := null;
    new.created_at        := now();
    return new;
  end if;

  -- UPDATE by the author: everything stays as it was except the answer.
  new.id                := old.id;
  new.user_id           := old.user_id;
  new.body              := old.body;
  new.show_name         := old.show_name;
  new.display_name      := old.display_name;
  new.status            := old.status;
  new.reported_at       := old.reported_at;
  new.report_count      := old.report_count;
  new.prayed_count      := old.prayed_count;
  new.approved_at       := old.approved_at;
  new.created_at        := old.created_at;
  -- Only Pastor Richmond writes the reply.
  new.pastor_reply      := old.pastor_reply;
  new.pastor_replied_at := old.pastor_replied_at;
  -- Marked answered once, at the time it is marked; never unmarked or moved.
  -- The praise update lives in prayer_answers, where it waits for review.
  new.answered_at  := case when old.answered_at is null and new.answered_at is not null then now() else old.answered_at end;
  return new;
end;
$$;

commit;
