#!/bin/bash
# Talk Before You Marry, new edition: upload the 15 recordings, check, and publish
# the hidden test course. Run from the faithfulpath folder:
#   bash scripts/tbym-new-publish.sh
set -e
cd "$(dirname "$0")/.."
LESSONS="$HOME/Desktop/Talk Before You Marry Course/02 Lessons"

echo "1. Uploading the 15 lesson recordings (private bucket, their own folder)..."
for d in "$LESSONS"/Lesson\ */; do
  n="${d##*Lesson }"; n="${n:0:2}"
  f="$d/3 Finished Lesson/tbym-lesson-$n.mp3"
  [ -f "$f" ] || { echo "Missing: $f"; exit 1; }
  npm run -s media:upload -- "$f" --course talk-before-you-marry-new
done

echo "2. Checking the pages and the code..."
node scripts/verify-tbym-new.mjs | tail -3
npx tsc --noEmit
npx tsx --env-file=.env.local scripts/render-tbym-new.ts | tail -2

echo "3. Saving and publishing (hidden: members only, not linked anywhere)..."
git add lib/tbym-new.ts lib/tbym-new-live.ts next.config.ts \
  "app/members/courses/talk-before-you-marry-new" \
  content/courses/talk-before-you-marry-new \
  scripts/verify-tbym-new.mjs scripts/render-tbym-new.ts scripts/tbym-new-publish.sh
git commit -m "Talk Before You Marry new edition: hidden test course, all 15 lessons" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
echo
echo "Done. In a few minutes, open: https://faithfulpathcommunity.com/members/courses/talk-before-you-marry-new"
