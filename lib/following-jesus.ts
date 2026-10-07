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
  return SERIES_LISTED ? [SERIES_PATH, ...COURSES.filter((c) => c.launched).map(coursePath)] : [];
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
  launched: boolean;
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
  { slug: "establish", book: 2, title: "Establish", subtitle: "Strong Foundations", fullTitle: "Establish: Strong Foundations", key: "following-jesus-establish", launched: false, lessons: [], completionPage: null },
  { slug: "grow", book: 3, title: "Grow", subtitle: "Becoming Like Jesus", fullTitle: "Grow: Becoming Like Jesus", key: "following-jesus-grow", launched: false, lessons: [], completionPage: null },
  { slug: "multiply", book: 4, title: "Multiply", subtitle: "Helping Others Follow Jesus", fullTitle: "Multiply: Helping Others Follow Jesus", key: "following-jesus-multiply", launched: false, lessons: [], completionPage: null },
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

export type FjOfferId = "following-jesus-begin" | "following-jesus-all-four" | "following-jesus-upgrade-all-four";

export type FjOffer = {
  id: FjOfferId;
  /** What Stripe Checkout, the receipt and the dashboard show. */
  title: string;
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
  "following-jesus-all-four": {
    id: "following-jesus-all-four",
    title: "Following Jesus: All Four Courses",
    priceCents: 8900,
    unlocks: ["begin", "establish", "grow", "multiply"],
  },
  // For someone who already owns Begin: the rest of the bundle at the
  // difference, US$29 + US$60 = US$89 (Richmond, 7 October 2026). Sold only to
  // a signed-in Begin owner; see canBuy().
  "following-jesus-upgrade-all-four": {
    id: "following-jesus-upgrade-all-four",
    title: "Following Jesus: Upgrade to All Four Courses",
    priceCents: 6000,
    unlocks: ["begin", "establish", "grow", "multiply"],
  },
};

const BEGIN_OFFERS: FjOfferId[] = ["following-jesus-begin"];
const ALL_FOUR_OFFERS: FjOfferId[] = ["following-jesus-all-four", "following-jesus-upgrade-all-four"];

/** Owns the whole series, by the bundle or by the upgrade. */
export function ownsAllFour(owned: Set<FjOfferId>): boolean {
  return ALL_FOUR_OFFERS.some((id) => owned.has(id));
}

/** Owns Begin on its own, so is offered the upgrade instead of the bundle. */
export function canUpgrade(owned: Set<FjOfferId>): boolean {
  return BEGIN_OFFERS.some((id) => owned.has(id)) && !ownsAllFour(owned);
}

/**
 * Whether someone with these purchases may buy this offer. Nobody pays twice
 * for what they have: Begin owners are offered the upgrade, not the bundle,
 * and the upgrade is only for Begin owners. `signedIn` is false for a visitor,
 * who can buy Begin or the bundle and sign in afterwards.
 */
export function canBuy(offer: FjOfferId, owned: Set<FjOfferId>, signedIn: boolean): boolean {
  if (ownsAllFour(owned)) return false;
  if (offer === "following-jesus-upgrade-all-four") return signedIn && canUpgrade(owned);
  if (canUpgrade(owned)) return false;
  return true;
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
    ...course.lessons.flatMap((l) => [`chapter-${l.slug.slice(-2)}.pdf`, `worksheet-${l.slug.slice(-2)}.pdf`]),
    "leaders-guide.pdf",
  ];
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
