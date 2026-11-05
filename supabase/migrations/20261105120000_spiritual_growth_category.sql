-- A fifth Books-store category, Spiritual Growth & Warfare (Richmond,
-- 5 November 2026), and Stand Firm moved into it.
--
-- Widens products_category_check to allow the new slug; the other four stay
-- as they are. The only row changed is Stand Firm's category. No other book
-- is touched.
--
-- Paste into the Supabase SQL editor and run once. Safe to run again.

begin;

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check check (
    category is null or category in (
      'following-jesus-series',
      'dating-marriage-and-relationships',
      'rest-worry-and-renewal',
      'spiritual-growth-and-warfare',
      'church-leadership'
    )
  );

update public.products set category = 'spiritual-growth-and-warfare', sort_order = 1
  where slug = 'stand-firm';                        -- Stand Firm

commit;

-- Read it back: Stand Firm in its new category, and every other book as before.
select coalesce(category, '(none)') as category, sort_order, title, published
from public.products
order by
  case category
    when 'following-jesus-series' then 1
    when 'dating-marriage-and-relationships' then 2
    when 'rest-worry-and-renewal' then 3
    when 'spiritual-growth-and-warfare' then 4
    when 'church-leadership' then 5
    else 6
  end,
  sort_order,
  created_at desc;
