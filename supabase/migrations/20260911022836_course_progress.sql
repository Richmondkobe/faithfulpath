-- Course progress and reflections for the membership courses.
--
-- Unlike members (written only by the Stripe webhook under the service-role
-- key), these are written by the member themselves, so the app uses the
-- cookie-backed anon client and RLS does the authorising. Every policy is
-- keyed on auth.uid(), so a member can only ever touch their own rows.
--
-- Lesson text and quizzes stay as files in the repo. Only progress and answers
-- live here.

begin;

create table if not exists public.course_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  course_slug     text not null,
  lesson_slug     text not null,
  -- Null until the member completes the lesson, so the column doubles as the
  -- completion flag and the date it happened.
  completed_at    timestamptz,
  -- Best score kept, not the latest: retrying must never lower it.
  quiz_best_score integer,
  quiz_passed     boolean not null default false,
  updated_at      timestamptz not null default now(),
  unique (user_id, course_slug, lesson_slug)
);

create table if not exists public.course_reflections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  course_slug    text not null,
  lesson_slug    text not null,
  -- Index into the lesson's reflection prompts, as ordered in its quiz JSON.
  question_index integer not null,
  answer         text not null default '',
  updated_at     timestamptz not null default now(),
  unique (user_id, course_slug, lesson_slug, question_index)
);

-- The overview page reads a whole course at once for one member.
create index if not exists course_progress_user_course_idx
  on public.course_progress (user_id, course_slug);
create index if not exists course_reflections_user_lesson_idx
  on public.course_reflections (user_id, course_slug, lesson_slug);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists course_progress_touch_updated_at on public.course_progress;
create trigger course_progress_touch_updated_at
  before update on public.course_progress
  for each row execute function public.touch_updated_at();

drop trigger if exists course_reflections_touch_updated_at on public.course_reflections;
create trigger course_reflections_touch_updated_at
  before update on public.course_reflections
  for each row execute function public.touch_updated_at();

alter table public.course_progress    enable row level security;
alter table public.course_reflections enable row level security;

-- Select, insert and update only your own rows. `with check` on insert and
-- update is what stops a member writing a row under someone else's user_id.
-- No delete policy: nothing in the app deletes progress.

drop policy if exists "Members read their own progress"   on public.course_progress;
drop policy if exists "Members insert their own progress" on public.course_progress;
drop policy if exists "Members update their own progress" on public.course_progress;

create policy "Members read their own progress"
  on public.course_progress for select to authenticated
  using (user_id = auth.uid());

create policy "Members insert their own progress"
  on public.course_progress for insert to authenticated
  with check (user_id = auth.uid());

create policy "Members update their own progress"
  on public.course_progress for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members read their own reflections"   on public.course_reflections;
drop policy if exists "Members insert their own reflections" on public.course_reflections;
drop policy if exists "Members update their own reflections" on public.course_reflections;

create policy "Members read their own reflections"
  on public.course_reflections for select to authenticated
  using (user_id = auth.uid());

create policy "Members insert their own reflections"
  on public.course_reflections for insert to authenticated
  with check (user_id = auth.uid());

create policy "Members update their own reflections"
  on public.course_reflections for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Signed-out visitors get nothing; members need no write grant beyond what the
-- policies above allow.
revoke all on public.course_progress    from anon;
revoke all on public.course_reflections from anon;
grant select, insert, update on public.course_progress    to authenticated;
grant select, insert, update on public.course_reflections to authenticated;

commit;
