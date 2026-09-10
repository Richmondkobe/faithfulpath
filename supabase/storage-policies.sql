-- Storage policies for the guide asset buckets.
--
-- Uploads move from the server action into the browser, so storage.objects now
-- has to authorise the admin directly instead of everything arriving under the
-- service-role key. Writes are restricted to the one admin address that
-- lib/auth.ts already gates the admin area on.
--
-- Reads are deliberately untouched:
--   * `covers`  stays a PUBLIC bucket, so cover images keep loading as they do.
--   * `guides`  stays PRIVATE. Purchased PDFs continue to be served only through
--               the short-lived signed URLs minted in /api/download/[token] with
--               the service-role key, which bypasses RLS entirely.
-- No SELECT policy is added, so this grants no new read access to anyone.

begin;

drop policy if exists "Admin can upload guide assets" on storage.objects;
drop policy if exists "Admin can update guide assets" on storage.objects;
drop policy if exists "Admin can delete guide assets" on storage.objects;

create policy "Admin can upload guide assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('covers', 'guides')
    and lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com'
  );

create policy "Admin can update guide assets"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('covers', 'guides')
    and lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com'
  )
  with check (
    bucket_id in ('covers', 'guides')
    and lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com'
  );

create policy "Admin can delete guide assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('covers', 'guides')
    and lower(auth.jwt() ->> 'email') = 'info@faithfulpathcommunity.com'
  );

commit;
