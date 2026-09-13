-- Written questions to Pastor Richmond, one per member per calendar month.
--
-- Written by the member themselves, so — like course_progress and
-- course_reflections — the app uses the cookie-backed anon client and RLS on
-- auth.uid() does the authorising. The answer does not come back through the
-- site: the question is emailed on, and Richmond replies to the member direct.

begin;

create table if not exists public.member_questions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  -- Stored alongside the id so a question can still be traced to an address
  -- after an email change, and so the admin view needs no join to auth.users.
  email      text not null,
  question   text not null,
  -- Whether the notification email actually went out. A failed send must not
  -- lose the question, so the row is written either way and this says which.
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

-- The monthly limit counts a member's rows within the current month, and the
-- members page reads the most recent one, so both want this index.
create index if not exists member_questions_user_created_idx
  on public.member_questions (user_id, created_at desc);

alter table public.member_questions enable row level security;

-- Read and insert your own, and nothing else. There is deliberately no update
-- or delete policy: a sent question is a record, not a draft. `with check` on
-- insert is what stops a member filing one under someone else's user_id.
drop policy if exists "Members read their own questions"   on public.member_questions;
drop policy if exists "Members insert their own questions" on public.member_questions;

create policy "Members read their own questions"
  on public.member_questions for select to authenticated
  using (user_id = auth.uid());

create policy "Members insert their own questions"
  on public.member_questions for insert to authenticated
  with check (user_id = auth.uid());

-- Signed-out visitors get nothing at all.
revoke all on public.member_questions from anon;
grant select, insert on public.member_questions to authenticated;

commit;
