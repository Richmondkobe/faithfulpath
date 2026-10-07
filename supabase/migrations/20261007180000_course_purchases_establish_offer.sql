-- Following Jesus: Establish, sold on its own at US$29.
--
-- course_purchases accepts one more offer. Only the check changes; no row is
-- read or altered. Owners of all four already have Establish through their
-- existing purchase (lib/following-jesus.ts works out what an offer opens).

begin;

alter table public.course_purchases
  drop constraint if exists course_purchases_offer_check;

alter table public.course_purchases
  add constraint course_purchases_offer_check check (offer in (
    'following-jesus-begin',
    'following-jesus-establish',
    'following-jesus-all-four',
    'following-jesus-upgrade-all-four'
  ));

commit;
