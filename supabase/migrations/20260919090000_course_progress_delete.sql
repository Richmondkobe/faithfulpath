-- Let a member delete their own progress row.
--
-- Added for Before You Say Yes, whose completion record carries a "Remove this
-- from my account" control. Without a delete policy the delete returned success
-- and removed nothing: the control reported the record gone while it stayed on
-- the account. Clearing completed_at is the fallback the update policy already
-- allows, but a learner who asks for the record to be removed should have the
-- row removed, not emptied — on this course in particular, a row saying someone
-- reached the last page of a course about whether to marry a person is itself
-- something they may not want on an account another person can open.

drop policy if exists "Members delete their own progress" on public.course_progress;

create policy "Members delete their own progress"
  on public.course_progress for delete to authenticated
  using (user_id = auth.uid());

grant delete on public.course_progress to authenticated;
