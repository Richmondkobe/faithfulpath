-- The book shown at the top of /start, the Instagram link page. Richmond
-- chooses it with "Featured on /start" in the admin book form.
--
-- At most one book can be featured: the unique index allows only one row
-- with the flag set. The admin form clears the old one before setting the new.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again. It adds
-- a column and changes nothing else; every book starts not featured.

begin;

alter table public.products
  add column if not exists featured_on_start boolean not null default false;

create unique index if not exists products_one_featured_on_start
  on public.products ((true))
  where featured_on_start;

commit;
