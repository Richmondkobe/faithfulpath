-- The Weekly Gathering repeats by itself (Richmond, 26 October 2026).
--
-- repeats_weekly: after a gathering ends, the site shows it again one week
-- later at the same Bangkok time (Bangkok has no summer time, so that is
-- always exactly seven days), with the same title, description and Zoom link,
-- until the gathering is deleted or a different one is added. Worked out by
-- the site when the page is shown: nothing is copied and nothing runs on a
-- timer.
--
-- skipped_dates: Bangkok dates on which a repeating gathering does not take
-- place ("Skip one week"), without ending the series.
--
-- Also ticks "Repeats every week" on the gathering of 8 November 2026, as
-- Richmond asked. Nothing else is changed. Paste into the Supabase SQL editor
-- and run once. Safe to run again.

begin;

alter table public.community_gatherings
  add column if not exists repeats_weekly boolean not null default false,
  add column if not exists skipped_dates date[] not null default '{}';

update public.community_gatherings
   set repeats_weekly = true
 where id = 'aef8810b-7e2d-45c6-a883-d28c161e7a31';

commit;
