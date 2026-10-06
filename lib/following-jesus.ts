// The Following Jesus series: four video courses sold on their own, outside
// the membership. Types and plain data only, so it is safe to import anywhere.
//
// Adding the next course is: drop its reviewed pages into
// content/courses/following-jesus/<slug>/, fill in its lessons below, and set
// `launched: true`. The all-four bundle opens it from that moment, because what
// a purchase unlocks is worked out here, not stored on the purchase.

export const SERIES_PATH = "/courses/following-jesus";

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
  /** The welcome page's heading, which is also its browser tab title. */
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
    fullTitle: "Begin: New Life in Christ",
    key: "following-jesus-begin",
    launched: true,
    lessons: lessons([
      "Jesus Christ and the Good News",
      "Repentance, Faith and Receiving Grace",
      "Born Again",
      "Following Jesus as Lord",
      "Your New Identity and Assurance",
      "Beginning With the Bible",
      "Beginning With Prayer",
      "Belonging to Christ's Church",
    ]),
    completionPage: { slug: "my-first-steps", title: "My First Steps" },
  },
  { slug: "establish", book: 2, title: "Establish", fullTitle: "Establish", key: "following-jesus-establish", launched: false, lessons: [], completionPage: null },
  { slug: "grow", book: 3, title: "Grow", fullTitle: "Grow", key: "following-jesus-grow", launched: false, lessons: [], completionPage: null },
  { slug: "multiply", book: 4, title: "Multiply", fullTitle: "Multiply", key: "following-jesus-multiply", launched: false, lessons: [], completionPage: null },
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

export type FjOfferId = "following-jesus-begin" | "following-jesus-all-four";

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
};

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
