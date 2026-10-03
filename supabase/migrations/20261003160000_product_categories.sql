-- One category per book, and a position within it.
--
-- Follows articles.category deliberately: the column stores only a slug, and
-- the labels, their order on /guides and the sentence under each heading live
-- in lib/book-categories.ts. Renaming "Rest, Worry & Renewal" is then a code
-- change, while adding a new category needs this constraint widened — which
-- makes a typo in the admin dropdown impossible and keeps the set of
-- categories an explicit decision.
--
-- Nullable on purpose. A book being drafted has no category yet, and an
-- uncategorised book must still appear in the store rather than vanish from
-- it: /guides lists any such book in a final group with no heading.
--
-- sort_order positions a book inside its category — the series has to read
-- Book 1, 2, 3, 4 then Life Guides, which is neither alphabetical nor the
-- order the rows were created. Default 0, so a new book lands at the top of
-- its category until given a number.

begin;

alter table public.products
  add column if not exists category text;

alter table public.products
  add column if not exists sort_order integer not null default 0;

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check check (
    category is null or category in (
      'following-jesus-series',
      'dating-marriage-and-relationships',
      'rest-worry-and-renewal',
      'church-leadership'
    )
  );

-- Both views on /guides run the same query: published books, by category, in
-- order within it. created_at trails behind so that two books sharing a
-- sort_order still come out in a stable order rather than an arbitrary one.
create index if not exists products_category_published_idx
  on public.products (category, published, sort_order, created_at desc);

-- The ten published books. Keyed on slug, which is unique and does not change,
-- with each title alongside so the mapping can be read back.
update public.products set category = 'following-jesus-series', sort_order = 1
  where slug = 'following-jesus-book-1-begin';      -- Following Jesus, Book 1: Begin
update public.products set category = 'following-jesus-series', sort_order = 2
  where slug = 'following-jesus-book-2-establish';  -- Following Jesus, Book 2: Establish
update public.products set category = 'following-jesus-series', sort_order = 3
  where slug = 'following-jesus-book-3-grow';       -- Following Jesus, Book 3: Grow
update public.products set category = 'following-jesus-series', sort_order = 4
  where slug = 'following-jesus-book-4-multiply';   -- Following Jesus, Book 4: Multiply
update public.products set category = 'following-jesus-series', sort_order = 5
  where slug = 'following-jesus-life-guides';       -- Following Jesus: Life Guides

update public.products set category = 'dating-marriage-and-relationships', sort_order = 1
  where slug = 'before-you-say-yes';                -- Before You Say Yes
update public.products set category = 'dating-marriage-and-relationships', sort_order = 2
  where slug = 'talk-before-you-marry';             -- Talk Before You Marry

update public.products set category = 'rest-worry-and-renewal', sort_order = 1
  where slug = 'the-christian-spiritual-reset';     -- The Christian Spiritual Reset
update public.products set category = 'rest-worry-and-renewal', sort_order = 2
  where slug = 'when-your-mind-wont-rest';          -- When Your Mind Won't Rest

update public.products set category = 'church-leadership', sort_order = 1
  where slug = 'lead-before-youre-ready';           -- Lead Before You're Ready

commit;

-- Read it back. Ten published books, each with a category, in the order
-- /guides will show them. Any published book with a null category is a book
-- the updates above missed.
select
  coalesce(category, '(none)') as category,
  sort_order,
  title,
  published
from public.products
order by
  case category
    when 'following-jesus-series' then 1
    when 'dating-marriage-and-relationships' then 2
    when 'rest-worry-and-renewal' then 3
    when 'church-leadership' then 4
    else 5
  end,
  sort_order,
  created_at desc;
