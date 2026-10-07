# Following Jesus

Four video courses, sold separately from the membership: Begin, Establish,
Grow, Multiply. One folder per course.

The HTML files here are the reviewed, final pages, copied byte for byte from
Richmond's course folder. **Do not edit them.** The site serves them as they
are and makes only these changes as each page is sent out:

- the MP3 name in `player.html` becomes a short-lived signed URL;
- the `player.html` iframe path, the buttons' links, and "Need help?" point at
  the website;
- the Google Fonts link is served from this site instead;
- a small script saves progress and the learner's own answers;
- the "Preview: … will work on the website" notes are removed.

`CHECKSUMS.sha256` in each course folder records the originals, so a check can
prove the files were never changed. A new approved version of a page replaces
the file and its checksum together.

The MP3s and PDFs are not in the repo. They reach only buyers, through
signed URLs:

- **Audio:** private `course-media` bucket, `audio/following-jesus-<course>/`.
- **PDFs:** private `course-downloads` bucket (PDF only),
  `following-jesus-<course>/`: `chapter-01.pdf` … (cut from the ebook),
  `worksheet-01.pdf` …, and `leaders-guide.pdf`. Built and uploaded with

      npm run fj:downloads -- "~/Desktop/Following Jesus Begin Course"

  For Establish: `npm run fj:downloads -- "~/Desktop/Following Jesus Establish Course" --course establish`.
  Chapters are named by the book's own numbers (Begin 1–8, Establish 9–18).

  Each chapter file is the title and copyright pages, the chapter, and all six
  Support Pages (the chapters send readers to them "at the back of this
  book"); the last chapter also keeps the "What you have learned" summary.
  Re-run it whenever the ebook, a worksheet or the guide changes.
