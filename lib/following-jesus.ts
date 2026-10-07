// The Following Jesus series: four video courses sold on their own, outside
// the membership. Types and plain data only, so it is safe to import anywhere.
//
// Adding the next course is: drop its reviewed pages into
// content/courses/following-jesus/<slug>/, fill in its lessons below, and set
// `launched: true`. The all-four bundle opens it from that moment, because what
// a purchase unlocks is worked out here, not stored on the purchase.

export const SERIES_PATH = "/courses/following-jesus";

/**
 * Whether the site points anyone to the series. Off while Richmond tested Begin
 * on the live site (from 6 October 2026), when the pages opened by their
 * address only; on since he finished testing (7 October 2026). On, it shows the
 * line on /membership, lets the series page and the public welcome pages be
 * indexed, and lists them in the sitemap. Lessons, downloads and the
 * completion page are noindex and behind the purchase either way.
 */
export const SERIES_LISTED = true;

/** The series' public pages, for the sitemap: the series home and each launched course's welcome page. */
export function publicSeriesPaths(): string[] {
  return SERIES_LISTED ? [SERIES_PATH, ...COURSES.filter((c) => c.launched && c.listed).map(coursePath)] : [];
}

export type FjCourseSlug = "begin" | "establish" | "grow" | "multiply";

export type FjLesson = {
  /** The URL segment and the progress key: lesson-01 … */
  slug: string;
  number: number;
  title: string;
};

export type FjCourse = {
  slug: FjCourseSlug;
  /** Book number in the series, 1 to 4. */
  book: number;
  title: string;
  /** "New Life in Christ": shown on the series page, and part of the full title. */
  subtitle: string;
  /** "Begin: New Life in Christ", the welcome page's heading and its tab title. */
  fullTitle: string;
  /** The course_slug in course_progress, course_completions and course_private_answers. */
  key: string;
  /** Working: it can be bought and opened by its address, and all-four owners have it. */
  launched: boolean;
  /**
   * Pointed to: the series page links to it, search engines may list it, and
   * the other courses' buttons lead to it. Off while Richmond tests a new course.
   */
  listed: boolean;
  /** The book's own number for the first lesson's chapter: Begin 1, Establish 9. */
  firstChapter: number;
  /** The line under the course on the series page, once it is listed. */
  seriesLine: string;
  lessons: FjLesson[];
  /** The page after the last lesson, if the course has one. */
  completionPage: { slug: string; title: string } | null;
};

function lessons(titles: string[]): FjLesson[] {
  return titles.map((title, i) => ({
    slug: `lesson-${String(i + 1).padStart(2, "0")}`,
    number: i + 1,
    title,
  }));
}

export const COURSES: FjCourse[] = [
  {
    slug: "begin",
    book: 1,
    title: "Begin",
    subtitle: "New Life in Christ",
    fullTitle: "Begin: New Life in Christ",
    key: "following-jesus-begin",
    launched: true,
    listed: true,
    firstChapter: 1,
    seriesLine: "8 lessons for the first steps of following Jesus.",
    lessons: lessons([
      "Jesus Christ and the Good News",
      "Repentance, Faith and Receiving Grace",
      "Born Again: What God Has Done in You",
      "Following Jesus as Lord",
      "Your New Identity and Assurance",
      "Beginning With the Bible",
      "Beginning With Prayer",
      "Belonging to Christ's Church",
    ]),
    completionPage: { slug: "my-first-steps", title: "My First Steps" },
  },
  {
    slug: "establish",
    book: 2,
    title: "Establish",
    subtitle: "Strong Foundations",
    fullTitle: "Establish: Strong Foundations",
    key: "following-jesus-establish",
    launched: true,
    // Unlisted until Richmond has tested it (7 October 2026).
    listed: false,
    firstChapter: 9,
    // From the welcome page's own line: "Ten lessons on what Christians
    // believe, and how that truth shapes life."
    seriesLine: "10 lessons on what Christians believe, and how that truth shapes life.",
    lessons: lessons([
      "The Bible: Understanding and Applying God's Word",
      "The One God: Father, Son and Holy Spirit",
      "Creation, Human Dignity, Sin and the Fall",
      "Jesus: His Life, Cross, Resurrection and Reign",
      "Salvation: Grace, Adoption and a New Way of Life",
      "The Holy Spirit: Presence, Power, Fruit and Gifts",
      "Baptism and the Lord's Supper",
      "Prayer, Worship and Fasting",
      "The Church: Belonging, Leadership, Service and Care",
      "God's Kingdom and Our Christian Hope",
    ]),
    completionPage: { slug: "my-foundations", title: "My Foundations" },
  },
  // firstChapter for Grow and Multiply is set when each is added.
  { slug: "grow", book: 3, title: "Grow", subtitle: "Becoming Like Jesus", fullTitle: "Grow: Becoming Like Jesus", key: "following-jesus-grow", launched: false, listed: false, firstChapter: 0, seriesLine: "", lessons: [], completionPage: null },
  { slug: "multiply", book: 4, title: "Multiply", subtitle: "Helping Others Follow Jesus", fullTitle: "Multiply: Helping Others Follow Jesus", key: "following-jesus-multiply", launched: false, listed: false, firstChapter: 0, seriesLine: "", lessons: [], completionPage: null },
];

export function findCourse(slug: string): FjCourse | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

export function coursePath(course: FjCourse): string {
  return `${SERIES_PATH}/${course.slug}`;
}

/** Browser tab titles, in the form Richmond chose on 6 October 2026. */
export const tabTitle = (page: string) => `${page} | Following Jesus`;

/* ----------------------------------------------------------------- offers */

export type FjOfferId =
  | "following-jesus-begin"
  | "following-jesus-establish"
  | "following-jesus-all-four"
  | "following-jesus-upgrade-all-four";

export type FjOffer = {
  id: FjOfferId;
  /** What Stripe Checkout, the receipt and the dashboard show. */
  title: string;
  /** The price. The upgrade's is worked out per buyer: see upgradePriceCents(). */
  priceCents: number;
  unlocks: FjCourseSlug[];
};

// The prices are set here and nowhere else; the checkout reads them from this
// list, never from the submitted form. Stripe holds no product or price for
// them, the same as the Books store.
export const OFFERS: Record<FjOfferId, FjOffer> = {
  "following-jesus-begin": {
    id: "following-jesus-begin",
    title: "Following Jesus: Begin",
    priceCents: 2900,
    unlocks: ["begin"],
  },
  "following-jesus-establish": {
    id: "following-jesus-establish",
    title: "Following Jesus: Establish",
    priceCents: 2900,
    unlocks: ["establish"],
  },
  "following-jesus-all-four": {
    id: "following-jesus-all-four",
    title: "Following Jesus: All Four Courses",
    priceCents: 8900,
    unlocks: ["begin", "establish", "grow", "multiply"],
  },
  // For someone who already owns one or more courses on their own: the rest of
  // the bundle at the difference. priceCents here is only the most it can be;
  // the real price is upgradePriceCents(). Sold only to a signed-in owner.
  "following-jesus-upgrade-all-four": {
    id: "following-jesus-upgrade-all-four",
    title: "Following Jesus: Upgrade to All Four Courses",
    priceCents: 6000,
    unlocks: ["begin", "establish", "grow", "multiply"],
  },
};

/** Each course's own single-course offer, once it has one. */
const SINGLE_OFFERS: Partial<Record<FjCourseSlug, FjOfferId>> = {
  begin: "following-jesus-begin",
  establish: "following-jesus-establish",
};
const ALL_FOUR_OFFERS: FjOfferId[] = ["following-jesus-all-four", "following-jesus-upgrade-all-four"];

export function singleOfferFor(course: FjCourse): FjOffer | null {
  const id = SINGLE_OFFERS[course.slug];
  return id ? OFFERS[id] : null;
}

/** Owns the whole series, by the bundle or by the upgrade. */
export function ownsAllFour(owned: Set<FjOfferId>): boolean {
  return ALL_FOUR_OFFERS.some((id) => owned.has(id));
}

/**
 * What the upgrade to all four costs this person: US$89 less US$29 for each
 * course they already own on its own (Richmond, 7 October 2026). Owns Begin
 * only, or Establish only: US$60. Owns both: US$31. Null when there is no
 * upgrade to offer: they own none on its own, already own all four, or own so
 * many singly that nothing would be left to pay.
 */
export function upgradePriceCents(owned: Set<FjOfferId>): number | null {
  if (ownsAllFour(owned)) return null;
  const paid = Object.values(SINGLE_OFFERS)
    .filter((id) => owned.has(id))
    .reduce((sum, id) => sum + OFFERS[id].priceCents, 0);
  if (paid === 0) return null;
  const price = OFFERS["following-jesus-all-four"].priceCents - paid;
  return price > 0 ? price : null;
}

/** Offered the upgrade rather than the bundle. */
export function canUpgrade(owned: Set<FjOfferId>): boolean {
  return upgradePriceCents(owned) !== null;
}

/** What this person pays for this offer. */
export function priceFor(offer: FjOfferId, owned: Set<FjOfferId>): number {
  return offer === "following-jesus-upgrade-all-four" ? (upgradePriceCents(owned) ?? 0) : OFFERS[offer].priceCents;
}

/**
 * Whether someone with these purchases may buy this offer. Nobody pays twice
 * for what they have:
 *   * a course they own is not sold to them again, singly or in the bundle;
 *   * someone who owns a course singly gets the upgrade, not the full bundle;
 *   * the upgrade is only for a signed-in owner of a single course;
 *   * someone with all four is sold nothing.
 * `signedIn` is false for a visitor, who can buy a course or the bundle and
 * sign in afterwards.
 */
export function canBuy(offer: FjOfferId, owned: Set<FjOfferId>, signedIn: boolean): boolean {
  if (ownsAllFour(owned)) return false;
  if (offer === "following-jesus-upgrade-all-four") return signedIn && canUpgrade(owned);
  if (offer === "following-jesus-all-four") return !Object.values(SINGLE_OFFERS).some((id) => owned.has(id));
  return !owned.has(offer);
}

export function isOfferId(value: unknown): value is FjOfferId {
  return typeof value === "string" && Object.hasOwn(OFFERS, value);
}

/**
 * Whether these purchases open this course: one of them covers it, and it has
 * launched. A bundle bought today opens Establish on the day it launches.
 */
export function offersOpenCourse(offers: Iterable<FjOfferId>, course: FjCourse): boolean {
  if (!course.launched) return false;
  for (const id of offers) {
    if (OFFERS[id].unlocks.includes(course.slug)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ pages */

/** The query that brings someone back to the course page from a closed completion page. */
export const FINISH_FIRST = "finish-first";

/** "Lesson 6", "Lessons 6 and 7", "Lessons 2, 6 and 7". */
export function lessonList(lessons: FjLesson[]): string {
  const n = lessons.map((l) => String(l.number));
  if (n.length === 1) return `Lesson ${n[0]}`;
  return `Lessons ${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

export function findLesson(course: FjCourse, slug: string): FjLesson | null {
  return course.lessons.find((l) => l.slug === slug) ?? null;
}

/** Where the files for a course's PDFs and audio live in storage. */
export function storageFolder(course: FjCourse): string {
  return course.key;
}

/**
 * The PDFs a buyer can download for a course: a chapter and a worksheet per
 * lesson, and the Leader's Guide. The names are the files in the
 * course-downloads bucket, as scripts/fj-downloads.mjs uploads them.
 */
export function downloadFiles(course: FjCourse): string[] {
  return [
    ...course.lessons.flatMap((l) => [chapterFile(course, l), `worksheet-${l.slug.slice(-2)}.pdf`]),
    "leaders-guide.pdf",
  ];
}

/** The book's chapter for a lesson: Establish's Lesson 1 is Chapter 9. */
export function chapterNumber(course: FjCourse, lesson: FjLesson): number {
  return course.firstChapter + lesson.number - 1;
}

/** chapter-01.pdf for Begin's Lesson 1, chapter-09.pdf for Establish's. */
export function chapterFile(course: FjCourse, lesson: FjLesson): string {
  return `chapter-${String(chapterNumber(course, lesson)).padStart(2, "0")}.pdf`;
}

export function downloadPath(course: FjCourse, file: string): string {
  return `${coursePath(course)}/downloads/${file}`;
}

/** "6 October 2026", as the pages write dates. */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
