-- A seventh article category: "New to Faith & Discipleship".
--
-- Only the constraint changes. The label and the position in the row of topics
-- live in lib/categories.ts, as the comment on the original migration says —
-- this file knows the slug and nothing else.
--
-- Widening the constraint is the deliberate part of adding a category: it is
-- why a typo in the admin dropdown cannot reach the table, and it is why this
-- has to run before the code that offers the new option.
--
-- No article is assigned here. Which existing articles belong under "New to
-- Faith & Discipleship" is an editorial decision, not a migration's to make,
-- and all 44 published articles already carry one of the other six categories.

begin;

alter table public.articles
  drop constraint if exists articles_category_check;

alter table public.articles
  add constraint articles_category_check check (
    category is null or category in (
      'new-to-faith-and-discipleship',
      'burnout-rest-and-retreats',
      'overthinking-and-worry',
      'prayer-and-hearing-god',
      'dating-and-discernment',
      'marriage-and-premarital',
      'church-leadership'
    )
  );

commit;

-- Read it back: the constraint's definition, and what is currently filed where.
-- 'new-to-faith-and-discipleship' should appear in the first result and not yet
-- in the second.
select pg_get_constraintdef(oid) as constraint_now
from pg_constraint
where conname = 'articles_category_check';

select
  coalesce(category, '(none)') as category,
  count(*) filter (where published) as published,
  count(*) as total
from public.articles
group by category
order by published desc, category;
