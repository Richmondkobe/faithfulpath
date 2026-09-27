/**
 * Old Zyro URLs with nothing on the new site to send a reader to.
 *
 * These used to redirect to /articles. A redirect from a specific page to an
 * index is a soft 404: the reader arrives somewhere that does not answer the
 * question they searched for, and Google eventually drops the old URL anyway
 * while treating the index as a poor destination. 410 Gone says the honest
 * thing — the page existed and does not any more — and asks for the URL to be
 * dropped from the index.
 *
 * A path leaves this list the moment an article covers its topic: move it into
 * the named redirects in next.config.ts, the way
 * /christian-mens-retreat-themes went.
 *
 * proxy.ts serves the 410. Its matcher has to repeat these paths, because a
 * proxy matcher is read at build time and cannot be built from this array —
 * GONE_PATHS stays the authority on what is gone, and the matcher only decides
 * where the proxy runs. GONE_MATCHER below is that spelling, to copy across
 * when this list changes.
 */
export const GONE_PATHS = [
  "hidden-gems-lesser-known-parables-of-jesus",
  "financial-miracle-testimony",
  "spiritual-gates-explained",
  "understanding-john-653-56-eat-my-flesh-drink-my-blo",
  "christian-mental-health-podcasts",
  "globalism-in-prophecy",
  "can-christians-have-multiple-spiritual-gifts",
  "christian-social-media-outreach",
  "bible-verses-on-technology-advancement",
  "christian-dating-apps",
  "fruits-vs-gifts-of-the-holy-spirit-explained-fruits",
  "can-the-devil-perform-miracles",
  "christian-dating-and-long-distance",
  "can-satan-be-forgiven",
  "1-timothy-5-17-18-explained",
  "mark-823-symbolism",
  "youth-ministry-lessons-parables",
  "the-minor-prophets",
  "lower-cholesterol-christian-guide",
  "womens-bible-study-topics",
  "wealth-and-prosperity-biblical-truths",
  "aliens-in-the-bible",
  "what-does-the-bible-say-about-masturbation",
  "jesus-siblings",
  "forbidden-fruit-garden-eden",
  "capital-punishment-bible-christians",
  "did-jesus-descend-into-hell",
  "christian-view-of-afterlife",
  "predestination-and-free-will",
] as const;

/** The same paths as one matcher entry for proxy.ts. */
export const GONE_MATCHER = "/(hidden-gems-lesser-known-parables-of-jesus|financial-miracle-testimony|spiritual-gates-explained|understanding-john-653-56-eat-my-flesh-drink-my-blo|christian-mental-health-podcasts|globalism-in-prophecy|can-christians-have-multiple-spiritual-gifts|christian-social-media-outreach|bible-verses-on-technology-advancement|christian-dating-apps|fruits-vs-gifts-of-the-holy-spirit-explained-fruits|can-the-devil-perform-miracles|christian-dating-and-long-distance|can-satan-be-forgiven|1-timothy-5-17-18-explained|mark-823-symbolism|youth-ministry-lessons-parables|the-minor-prophets|lower-cholesterol-christian-guide|womens-bible-study-topics|wealth-and-prosperity-biblical-truths|aliens-in-the-bible|what-does-the-bible-say-about-masturbation|jesus-siblings|forbidden-fruit-garden-eden|capital-punishment-bible-christians|did-jesus-descend-into-hell|christian-view-of-afterlife|predestination-and-free-will)";

const gone = new Set<string>(GONE_PATHS);

/** Whether a request path is one of the gone URLs. A trailing slash counts. */
export function isGonePath(pathname: string): boolean {
  return gone.has(pathname.replace(/^\//, "").replace(/\/$/, ""));
}
