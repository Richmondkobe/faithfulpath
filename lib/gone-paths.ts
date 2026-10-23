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
  "understanding-john-653-56-eat-my-flesh-drink-my-blo",
  "christian-mental-health-podcasts",
  "christian-dating-apps",
  "fruits-vs-gifts-of-the-holy-spirit-explained-fruits",
  "christian-dating-and-long-distance",
  "can-satan-be-forgiven",
  "1-timothy-5-17-18-explained",
  "mark-823-symbolism",
  "youth-ministry-lessons-parables",
  "the-minor-prophets",
  "lower-cholesterol-christian-guide",
  "what-does-the-bible-say-about-masturbation",
  "ark-of-the-covenant-today",
  "polygamy-in-scripture",
  "women-in-ministry",
  "healing-from-religious-trauma-reclaim-your-faith",
  "the-role-of-the-holy-spirit-in-modern-christian-life",
  "can-loved-ones-in-heaven-see-us-on-earth",
  "bible-study-methods",
  "salt-dating-app",
  "interracial-marriage-bible",
  "ephesians-6-10-18-breakdown",
  "bible-number-symbolism",
  "biblical-guidance-for-toxic-relationships",
  "what-does-the-bible-say-about-monogamy",
  "the-bible-monogamy",
  "did-god-approve-polygamy-in-the-bible",
  "who-created-god",
  "christian-views-on-ivf-and-surrogacy",
  "karate-and-christianity",
  "book-of-revelation-meaning",
  "understanding-natural-disasters-a-biblical-perspective",
  "animal-sacrifices-christianity",
  "christian-dating-and-courtship",
  "faith-based-time-management",
  "church-grant-writing-ministries",
  "christian-leadership-retreats-women",
  "sermon-preparation-tools",
  "nursing-home-outreach-church-ministryd-meaningful",
  "build-self-confidence-through-faith-a-simple-guide",
  "launching-christian-nonprofit",
  "christian-podcast-ideas",
  "christian-money-millennials",
  "christian-vocation-vs-career",
  "bible-universal-salvation",
  "faith-based-fitness-programs",
  "polygamy-in-the-old-testament-vs-monogamy-today",
  "christian-perspectives-on-psychedelic-therapy",
  "youth-ministry-burnout-prevention",
  "start-budgeting-christian",
  "2-corinthians-12-7-theories",
  "was-mary-sinless-insights-on-immaculate-conception",
  "strong-marriage-biblical-principles",
  "christian-dating-and-faith",
  "church-plant-fundraising-templates",
  "does-god-play-favorites-reconciling-his-impartiality-and-israels-chosen-status",
  "is-it-ever-okay-to-lie",
  "christian-dating-online-safety",
  "marys-journey-after-jesus",
  "develop-more-patience-christian",
  "christian-dating-and-prayer",
  "strength-in-faith-living-with-chronic-illness",
  "trusting-god-through-career-changes",
  "reconcile-science-creation-genesis",
  "how-to-forgive-someone-who-hurt-you-deeply",
  "joy-in-the-journey",
  "christian-dating-and-patience",
  "stewardship-secrets",
  "christian-homeschooling",
  "healing-through-faith",
  "mental-health-stigma-in-church",
  "bible-based-time-management-for-moms-practical-time-blocking-to-prioritize-faith-family",
  "mindful-prayer-journal-",
  "forgiveness-and-healing-a-path-to-renewal",
  "women-pastors-in-the-bible",
  "understanding-the-mark-of-the-beast-in-revelation-13",
  "the-untold-stories-of-women-who-shaped-the-early-church",
  "strengthen-your-marriage-through-faith-and-communicationcouples-communication",
  "spiritual-growth-journey",
  "living-our-faith-today",
  "living-in-harmony-",
  "habits-of-a-faithful-life",
  "family-time-tips",
  "faithful-freedom-faith-based-approach",
  "faithful-foundations-christian-life",
  "does-the-bible-teach-universal-salvation-exploring-key-verses-and-their-meaning",
  "deepening-your-faith-deeper-connection-with-god",
  "connected-in-christ",
  "christian-fasting-benefits",
  "christian-book-store/christian-women-books",
  "christian-book-store/christian-ministry-books",
  "christian-book-store/christian-leadership-books",
  "christian-book-store/christian-biographies-church-history",
  "bible-insights-on-mental-health-challenges-bible-mental-health",
] as const;

/** The same paths as one matcher entry for proxy.ts. */
export const GONE_MATCHER = "/(understanding-john-653-56-eat-my-flesh-drink-my-blo|christian-mental-health-podcasts|christian-dating-apps|fruits-vs-gifts-of-the-holy-spirit-explained-fruits|christian-dating-and-long-distance|can-satan-be-forgiven|1-timothy-5-17-18-explained|mark-823-symbolism|youth-ministry-lessons-parables|the-minor-prophets|lower-cholesterol-christian-guide|what-does-the-bible-say-about-masturbation|ark-of-the-covenant-today|polygamy-in-scripture|women-in-ministry|healing-from-religious-trauma-reclaim-your-faith|the-role-of-the-holy-spirit-in-modern-christian-life|can-loved-ones-in-heaven-see-us-on-earth|bible-study-methods|salt-dating-app|interracial-marriage-bible|ephesians-6-10-18-breakdown|bible-number-symbolism|biblical-guidance-for-toxic-relationships|what-does-the-bible-say-about-monogamy|the-bible-monogamy|did-god-approve-polygamy-in-the-bible|who-created-god|christian-views-on-ivf-and-surrogacy|karate-and-christianity|book-of-revelation-meaning|understanding-natural-disasters-a-biblical-perspective|animal-sacrifices-christianity|christian-dating-and-courtship|faith-based-time-management|church-grant-writing-ministries|christian-leadership-retreats-women|sermon-preparation-tools|nursing-home-outreach-church-ministryd-meaningful|build-self-confidence-through-faith-a-simple-guide|launching-christian-nonprofit|christian-podcast-ideas|christian-money-millennials|christian-vocation-vs-career|bible-universal-salvation|faith-based-fitness-programs|polygamy-in-the-old-testament-vs-monogamy-today|christian-perspectives-on-psychedelic-therapy|youth-ministry-burnout-prevention|start-budgeting-christian|2-corinthians-12-7-theories|was-mary-sinless-insights-on-immaculate-conception|strong-marriage-biblical-principles|christian-dating-and-faith|church-plant-fundraising-templates|does-god-play-favorites-reconciling-his-impartiality-and-israels-chosen-status|is-it-ever-okay-to-lie|christian-dating-online-safety|marys-journey-after-jesus|develop-more-patience-christian|christian-dating-and-prayer|strength-in-faith-living-with-chronic-illness|trusting-god-through-career-changes|reconcile-science-creation-genesis|how-to-forgive-someone-who-hurt-you-deeply|joy-in-the-journey|christian-dating-and-patience|stewardship-secrets|christian-homeschooling|healing-through-faith|mental-health-stigma-in-church|bible-based-time-management-for-moms-practical-time-blocking-to-prioritize-faith-family|mindful-prayer-journal-|forgiveness-and-healing-a-path-to-renewal|women-pastors-in-the-bible|understanding-the-mark-of-the-beast-in-revelation-13|the-untold-stories-of-women-who-shaped-the-early-church|strengthen-your-marriage-through-faith-and-communicationcouples-communication|spiritual-growth-journey|living-our-faith-today|living-in-harmony-|habits-of-a-faithful-life|family-time-tips|faithful-freedom-faith-based-approach|faithful-foundations-christian-life|does-the-bible-teach-universal-salvation-exploring-key-verses-and-their-meaning|deepening-your-faith-deeper-connection-with-god|connected-in-christ|christian-fasting-benefits|christian-book-store/christian-women-books|christian-book-store/christian-ministry-books|christian-book-store/christian-leadership-books|christian-book-store/christian-biographies-church-history|bible-insights-on-mental-health-challenges-bible-mental-health)";

const gone = new Set<string>(GONE_PATHS);

/** Whether a request path is one of the gone URLs. A trailing slash counts. */
export function isGonePath(pathname: string): boolean {
  return gone.has(pathname.replace(/^\//, "").replace(/\/$/, ""));
}
