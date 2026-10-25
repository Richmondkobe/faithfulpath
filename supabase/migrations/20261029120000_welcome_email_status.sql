-- Whether each community member's welcome email went (Richmond, 26 October
-- 2026), for Admin -> Community: "Welcome email: sent" or "failed", with a
-- Resend button. Written by the site (service role) after it sends.
--
-- The profile guard is redefined to keep these two columns out of members'
-- hands, as it already does for the MailerLite ones. Nothing else changes.
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

alter table public.community_profiles
  add column if not exists welcome_sent_at timestamptz,
  add column if not exists welcome_error   text;

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

commit;
