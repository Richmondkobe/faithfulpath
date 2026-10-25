-- Giving: "Support the Ministry" at /give (Richmond, 26 October 2026).
--
-- Gifts are kept entirely apart from book sales (purchases), the Following
-- Jesus courses (course_purchases) and the membership (members). Nothing here
-- reads or writes those tables, and a gift never opens anything: the Stripe
-- webhook recognises a gift by metadata type=gift and sends it here instead
-- (app/api/stripe/webhook/route.ts).
--
-- Written only by the Stripe webhook and read only by the admin page, both
-- through the service role, so RLS is on with no policies: nobody signed in
-- or signed out can read or change these directly.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

-- Every gift that has been paid: a one-time gift, or one month of a monthly
-- partnership (each renewal is its own row, so the totals add up).
create table if not exists public.gifts (
  id                     uuid primary key default gen_random_uuid(),
  -- The Stripe payment this is: a PaymentIntent (one-time) or an Invoice
  -- (monthly). Unique, so a webhook Stripe sends twice is recorded once.
  stripe_ref             text not null unique,
  kind                   text not null check (kind in ('one_time', 'monthly')),
  amount_cents           integer not null check (amount_cents > 0),
  currency               text not null default 'usd',
  name                   text,
  email                  text,
  stripe_customer_id     text,
  stripe_subscription_id text,
  paid_at                timestamptz not null default now(),
  created_at             timestamptz not null default now()
);

create index if not exists gifts_paid_idx on public.gifts (paid_at desc);

-- Monthly partners: one row per Stripe subscription, kept in step with it.
create table if not exists public.ministry_partners (
  stripe_subscription_id text primary key,
  stripe_customer_id     text,
  name                   text,
  email                  text,
  amount_cents           integer not null check (amount_cents > 0),
  currency               text not null default 'usd',
  -- Stripe's subscription status: active, past_due, canceled, …
  status                 text not null,
  cancel_at_period_end   boolean not null default false,
  started_at             timestamptz not null default now(),
  canceled_at            timestamptz,
  -- When Richmond was emailed about this new partner: once only, whichever
  -- of Stripe's events arrives first.
  notified_at            timestamptz,
  updated_at             timestamptz not null default now()
);

create index if not exists ministry_partners_started_idx on public.ministry_partners (started_at desc);

alter table public.gifts             enable row level security;
alter table public.ministry_partners enable row level security;

revoke all on public.gifts             from anon, authenticated;
revoke all on public.ministry_partners from anon, authenticated;

commit;
