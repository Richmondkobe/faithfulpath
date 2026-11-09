/**
 * The one list of courses in the Course Membership (Growth Report, 9 November
 * 2026: "use one shared course list wherever the site displays the total").
 * Add a new membership course here and every page that shows the count or the
 * list updates with it. Titles and lines are the approved membership wording.
 */
export type MembershipCourse = { title: string; line: string; book: string; topic: string };

export const MEMBERSHIP_COURSES: MembershipCourse[] = [
  {
    title: "The Christian Spiritual Reset",
    line: "a guided retreat at home for burnout and spiritual dryness.",
    book: "the-christian-spiritual-reset",
    topic: "spiritual burnout",
  },
  {
    title: "When Your Mind Won’t Rest",
    line: "overthinking, worry and fear.",
    book: "when-your-mind-wont-rest",
    topic: "worry and overthinking",
  },
  {
    title: "Before You Say Yes",
    line: "discernment in dating and the decision to marry.",
    book: "before-you-say-yes",
    topic: "Christian dating",
  },
  {
    title: "Talk Before You Marry",
    line: "fifteen lessons for couples before marriage.",
    book: "talk-before-you-marry",
    topic: "preparing for marriage",
  },
  {
    title: "Lead Before You’re Ready",
    line: "for your first years of leading in a church.",
    book: "lead-before-youre-ready",
    topic: "church leadership",
  },
  {
    title: "Stand Firm",
    line: "twelve lessons on spiritual warfare and the armour of God.",
    book: "stand-firm",
    topic: "spiritual warfare",
  },
];

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** "six" — the number of membership courses, in words. */
export const COURSE_COUNT_WORD = WORDS[MEMBERSHIP_COURSES.length] ?? String(MEMBERSHIP_COURSES.length);
/** "Six" — capitalised, for the start of a heading or sentence. */
export const COURSE_COUNT_CAP = COURSE_COUNT_WORD.charAt(0).toUpperCase() + COURSE_COUNT_WORD.slice(1);

/** Joins the topics: "spiritual burnout, worry and overthinking, … and spiritual warfare". */
export function topicList(capitalise = false): string {
  const t = MEMBERSHIP_COURSES.map((c) => c.topic);
  const s = t.length > 1 ? `${t.slice(0, -1).join(", ")} and ${t[t.length - 1]}` : t[0];
  return capitalise ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Joins the course titles in italics for Markdown: "*A*, *B* … and *F*". */
export function titleListMarkdown(): string {
  const t = MEMBERSHIP_COURSES.map((c) => `*${c.title.replace("’", "'")}* (${c.topic})`);
  return `${t.slice(0, -1).join(", ")} and ${t[t.length - 1]}`;
}
