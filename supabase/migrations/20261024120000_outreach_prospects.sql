-- Backlink outreach: Christian blogs, ministry sites and directories that might
-- link to an article, and where each one has got to (admin /admin/outreach).
--
-- Only the admin account reads or writes this. The app uses the cookie-backed
-- client signed in as the admin, so these policies do the authorising, as well
-- as requireAdmin() in the page. Nothing here touches members, purchases,
-- articles or products.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

create table if not exists public.outreach_prospects (
  id               uuid primary key default gen_random_uuid(),
  site_name        text not null,
  site_url         text not null,
  -- The site's host, lower case and without "www.", worked out from site_url
  -- by the app. Unique, so the same site can never be added twice.
  domain           text not null unique,
  contact_name     text,
  contact_email    text,
  contact_page_url text,
  why_relevant     text,
  -- What the approach is for.
  goal             text not null default 'backlink'
                   check (goal in ('backlink', 'review_copy', 'guest_article', 'interview', 'church_partnership')),
  -- Which of Richmond's articles fits them, as /articles/<slug>.
  suggested_page   text,
  draft_subject    text,
  draft_body       text,
  status           text not null default 'new'
                   check (status in ('new', 'drafted', 'approved', 'sent', 'replied', 'declined', 'skipped')),
  notes            text,
  sent_at          timestamptz,
  replied_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists outreach_prospects_status_idx
  on public.outreach_prospects (status, created_at desc);

-- updated_at follows every edit, whoever makes it.
create or replace function public.outreach_prospects_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists outreach_prospects_touch on public.outreach_prospects;
create trigger outreach_prospects_touch
  before update on public.outreach_prospects
  for each row execute function public.outreach_prospects_touch();

alter table public.outreach_prospects enable row level security;

-- The admin account, by the same email rule as storage-policies.sql. No delete
-- policy: a site that is not a fit is marked "skipped", so it is never added
-- again by mistake.
drop policy if exists "Admin reads outreach"   on public.outreach_prospects;
drop policy if exists "Admin adds outreach"    on public.outreach_prospects;
drop policy if exists "Admin updates outreach" on public.outreach_prospects;

create policy "Admin reads outreach"
  on public.outreach_prospects for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com');

create policy "Admin adds outreach"
  on public.outreach_prospects for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com');

create policy "Admin updates outreach"
  on public.outreach_prospects for update to authenticated
  using (lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com')
  with check (lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com');

-- No public access at all, and no delete for anyone signed in.
revoke all on public.outreach_prospects from anon;
revoke all on public.outreach_prospects from authenticated;
grant select, insert, update on public.outreach_prospects to authenticated;

commit;
