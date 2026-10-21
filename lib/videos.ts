/**
 * Richmond's YouTube videos, in the order they are shown.
 *
 * To add one, add a line: the video ID from its YouTube address
 * (youtube.com/watch?v=<id>), its title, a sentence or two about it, the
 * upload date and length from YouTube (for search engines), and optionally
 * the book it belongs to (a /guides/<slug> slug: it then shows under "Watch
 * the series" on that book's page) and one article to show it in (an article
 * slug: it then shows after that article's opening section).
 *
 * The thumbnails are fetched from YouTube when the site is built and served
 * from this site (app/videos/thumbnail/[id]), so nothing is requested from
 * YouTube until someone presses play.
 */
export type Video = {
  id: string;
  title: string;
  description: string;
  /** ISO 8601, as YouTube gives it. */
  uploaded: string;
  /** ISO 8601 duration, e.g. PT19M54S. */
  duration: string;
  book?: string;
  article?: string;
};

export const VIDEOS: Video[] = [
  { id: "BDbkbvhXh8U", title: "7 Red Flags Christians Often Ignore", description: "Pastor Richmond Kobe walks through seven red flags Christians often spiritualise in dating, and how to tell an ordinary difference from a troubling pattern.", uploaded: "2026-10-19T18:38:24-07:00", duration: "PT19M54S", book: "before-you-say-yes", article: "christian-dating-red-flags" },
  { id: "8aSGo1Wa4R0", title: "What Does 'Equally Yoked' Really Mean?", description: "Pastor Richmond Kobe explains what 2 Corinthians 6:14 actually means, how it applies to dating and marriage, and five areas where a Christian couple needs to pull in the same direction.", uploaded: "2026-10-19T20:48:40-07:00", duration: "PT18M37S", book: "before-you-say-yes", article: "what-does-equally-yoked-mean" },
  { id: "flN96Mo4tG8", title: "10 Quiet Green Flags in a Christian Relationship", description: "Pastor Richmond Kobe walks through ten quiet signs of godly character in a Christian relationship: how someone treats your freedom, handles failure and lives the truth.", uploaded: "2026-10-20T08:24:08-07:00", duration: "PT18M43S", book: "before-you-say-yes", article: "green-flags-christian-relationship" },
  { id: "j6uVKsf2L98", title: "\"God Told Me You're the One\": How to Test It", description: "Pastor Richmond Kobe explains five biblical tests for when someone says \"God told me you're the one\": Scripture, freedom, peace, counsel and fruit.", uploaded: "2026-10-21", duration: "PT11M4S", book: "before-you-say-yes", article: "god-told-me-to-marry-you" },
];

export const videoThumbnail = (id: string) => `/videos/thumbnail/${id}`;

export const videosForBook = (slug: string) => VIDEOS.filter((v) => v.book === slug);

export const videoForArticle = (slug: string) => VIDEOS.find((v) => v.article === slug) ?? null;

/** VideoObject structured data for one video, for a page's JSON-LD graph. */
export function videoSchema(v: Video, abs: (path: string) => string, publisher: object) {
  return {
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: [abs(videoThumbnail(v.id)), `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`],
    uploadDate: v.uploaded,
    duration: v.duration,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    inLanguage: "en",
    publisher,
  };
}
