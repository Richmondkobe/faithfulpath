-- Book prices now match the outside ebook stores (Draft2Digital, Amazon Kindle),
-- decided 19 October 2026: the five Following Jesus books US$6.99, every other
-- book US$9.99. Prices live only in products.price_cents; book pages, the
-- checkout and the structured data all read them from here.

begin;

update public.products set price_cents = 699
  where category = 'following-jesus-series';

update public.products set price_cents = 999
  where category is distinct from 'following-jesus-series';

commit;

-- Check: every book with its new price.
select title, price_cents / 100.0 as price_usd, published
  from public.products
  order by category nulls last, sort_order;
