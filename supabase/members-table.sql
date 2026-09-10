-- Membership: one row per paying member, written only by the Stripe webhook.
--
-- Members are matched to their login by email, because they pay before they
-- ever sign in. The webhook writes with the service-role key, which bypasses
-- RLS; the only policy here is a read policy, so a signed-in member can see
-- their own row and nothing else.

begin;

create table if not exists public.members (
  id                     uuid primary key default gen_random_uuid(),
  email                  text not null,
  stripe_customer_id     text,
  stripe_subscription_id text,
  -- Mirrors Stripe's subscription.status values exactly, so the webhook can
  -- store what Stripe sends without translating it.
  status                 text not null default 'incomplete',
  cancel_at_period_end   boolean not null default false,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint members_status_check check (status in (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  ))
);

-- Email is the join between "who paid" and "who logged in", so it has to be
-- unique case-insensitively. The webhook lowercases before writing; indexing on
-- lower() means a stray capital can never open a second row for one person.
create unique index if not exists members_email_key
  on public.members (lower(email));

-- Partial, so rows can exist before Stripe has issued the ids.
create unique index if not exists members_stripe_customer_key
  on public.members (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists members_stripe_subscription_key
  on public.members (stripe_subscription_id) where stripe_subscription_id is not null;

create or replace function public.members_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_touch_updated_at on public.members;
create trigger members_touch_updated_at
  before update on public.members
  for each row execute function public.members_touch_updated_at();

alter table public.members enable row level security;

-- Read-only, and only your own row. There is deliberately no insert, update or
-- delete policy: every write goes through the webhook under the service-role
-- key, so no browser can create or alter a membership.
drop policy if exists "Members can read their own row" on public.members;
create policy "Members can read their own row"
  on public.members for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Signed-out visitors get nothing at all.
revoke all on public.members from anon;

-- Supabase grants the full set to `authenticated` by default. RLS already makes
-- a write match zero rows, but leaving the grant in place means a future policy
-- could combine with it by accident. Read is the only thing a member needs.
revoke insert, update, delete on public.members from authenticated;
grant select on public.members to authenticated;

commit;
