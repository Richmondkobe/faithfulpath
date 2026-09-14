-- One topic category per article.
--
-- Nullable on purpose: an article being drafted has no category yet, and an
-- uncategorised row must still list on /articles. It simply shows no label.
--
-- The labels and the order they display in live in lib/categories.ts, not here.
-- This column stores only the slug, so renaming "Overthinking & Worry" is a
-- code change. Adding a *new* category needs this constraint widened, which is
-- deliberate: it makes a typo in the admin impossible, and the set of topics is
-- a decision worth making explicitly rather than by whatever string is typed.

begin;

alter table public.articles
  add column if not exists category text;

alter table public.articles
  drop constraint if exists articles_category_check;

alter table public.articles
  add constraint articles_category_check check (
    category is null or category in (
      'burnout-rest-and-retreats',
      'overthinking-and-worry',
      'prayer-and-hearing-god',
      'dating-and-discernment',
      'marriage-and-premarital',
      'church-leadership'
    )
  );

-- Every category page runs the same query: this category, published, newest
-- first. published_at leads the sort, with created_at and id behind it, so the
-- index carries all three and the paging stays a range scan.
create index if not exists articles_category_published_idx
  on public.articles (category, published, published_at desc, created_at desc, id desc);

commit;
