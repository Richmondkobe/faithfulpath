-- Following Jesus: the upgrade from Begin to all four courses (US$60).
--
-- course_purchases accepted two offers. Someone who already owns Begin now
-- buys the rest at the difference (US$29 + US$60 = US$89) rather than the full
-- bundle, so the table accepts that offer too. Only the check changes; no row
-- is read or altered.

begin;

alter table public.course_purchases
  drop constraint if exists course_purchases_offer_check;

alter table public.course_purchases
  add constraint course_purchases_offer_check check (offer in (
    'following-jesus-begin',
    'following-jesus-all-four',
    'following-jesus-upgrade-all-four'
  ));

commit;
