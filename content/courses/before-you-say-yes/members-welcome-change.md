# /members welcome — prepared change, not applied

Ready to paste on switch-over day. **Nothing in the app has been changed.**

## The problem, which is live now rather than on switch-over day

`app/members/page.tsx` line 38 says:

> There are two courses below. Begin with either one; neither has to be
> finished before the other is started.

There are **three** cards on that page today. Before You Say Yes was published
on 19 September 2026 and its card has rendered ever since, so the sentence has
been wrong for every member who has visited since then — it is not something
that becomes wrong when the simple layer switches on.

Line 40 has the same problem in a quieter way. "If your mind is restless right
now" points at When Your Mind Won't Rest's entry page, and it now sits above
three courses without saying which one it belongs to.

## The replacement

```ts
"There are three courses below. Begin with any of them; none has to be finished before another is started.",
"Each begins by asking what you have room for today, and each keeps a shorter way in for when that is very little.",
"If your mind is restless right now, When Your Mind Won't Rest has a page that takes you straight to the part that matches.",
```

The first line replaces line 38, the second is unchanged, and the third
replaces line 40.

## Worth considering instead of a number

A written number goes stale the next time a course is added — which is exactly
what happened here. The count is already known at render time: the page decides
which cards to show. Deriving the sentence from that would mean it could not
drift again.

That is a slightly larger change than a copy edit, and it was not asked for, so
it is written down here rather than done.
