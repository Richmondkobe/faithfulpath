#!/bin/bash
# Before You Say Yes, new edition: upload the 21 recordings, check, and publish
# the hidden test course. Run from the faithfulpath folder:
#   bash scripts/bysy-new-publish.sh
set -e
cd "$(dirname "$0")/.."
LESSONS="$HOME/Desktop/Before You Say Yes Course/02 Lessons"

echo "1. Uploading the 21 lesson recordings (private bucket, their own folder)..."
for d in "$LESSONS"/Lesson\ */; do
  n="${d##*Lesson }"; n="${n:0:2}"
  f="$d/3 Finished Lesson/bysy-lesson-$n.mp3"
  [ -f "$f" ] || { echo "Missing: $f"; exit 1; }
  npm run -s media:upload -- "$f" --course before-you-say-yes-new
done

echo "2. Checking the pages and the code..."
node scripts/verify-bysy-new.mjs | tail -3
npx tsc --noEmit
npx tsx --env-file=.env.local scripts/render-bysy-new.ts | tail -2

echo "3. Saving and publishing (hidden: members only, not linked anywhere)..."
git add lib/bysy-new.ts lib/bysy-new-live.ts next.config.ts \
  "app/members/courses/before-you-say-yes-new" \
  content/courses/before-you-say-yes-new \
  scripts/verify-bysy-new.mjs scripts/render-bysy-new.ts scripts/bysy-new-publish.sh
git commit -m "Before You Say Yes new edition: hidden test course, all 21 lessons"
git push
echo
echo "Done. In a few minutes, open: https://faithfulpathcommunity.com/members/courses/before-you-say-yes-new"
