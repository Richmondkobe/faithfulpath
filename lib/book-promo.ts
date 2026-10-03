import { CATEGORIES } from "@/lib/categories";

/**
 * Which book an article should point at.
 *
 * Until now every promo box was written by hand into the article's own
 * body_md — thirty-four of them, in three different shapes. That works while
 * somebody remembers to add one, and the two premarital articles published
 * this week are what happens when nobody does: good articles selling nothing.
 *
 * So the box has a default now, by category, and an article only needs its own
 * entry when the default is wrong for it.
 */
export type BookSlug =
  | "talk-before-you-marry"
  | "before-you-say-yes"
  | "when-your-mind-wont-rest"
  | "the-christian-spiritual-reset"
  | "lead-before-youre-ready"
  | "following-jesus-book-1-begin";

/** The default for each category. Every category has one. */
export const BOOK_BY_CATEGORY: Record<string, BookSlug> = {
  "new-to-faith-and-discipleship": "following-jesus-book-1-begin",
  "marriage-and-premarital": "talk-before-you-marry",
  "dating-and-discernment": "before-you-say-yes",
  "overthinking-and-worry": "when-your-mind-wont-rest",
  "burnout-rest-and-retreats": "the-christian-spiritual-reset",
  "prayer-and-hearing-god": "the-christian-spiritual-reset",
  "church-leadership": "lead-before-youre-ready",
};

/**
 * Per-article overrides, which win over the category.
 *
 * Empty on purpose: there was no per-slug mapping before this, because the
 * promos lived in the prose. It is here for the article whose category is right
 * and whose book is not — a Church Leadership piece about a leader's own
 * burnout belongs to the retreat book, not the leadership one.
 */
export const BOOK_BY_ARTICLE: Record<string, BookSlug> = {};

/** The book for an article, or null if its category has no default. */
export function bookForArticle(
  slug: string,
  category: string | null
): BookSlug | null {
  return (
    BOOK_BY_ARTICLE[slug] ??
    (category ? BOOK_BY_CATEGORY[category] ?? null : null)
  );
}

/**
 * The box's own words, one per book: the question it answers, and what the book
 * covers. Kept beside the mapping rather than read from the products table —
 * the table holds a subtitle written to sell the book on its own page, which is
 * not the same sentence as one that follows an article.
 */
export const BOOK_COPY: Record<BookSlug, { title: string; hook: string; body: string }> = {
  "following-jesus-book-1-begin": {
    title: "Following Jesus, Book 1: Begin",
    hook: "New to the faith, or still exploring?",
    body:
      "a first course in following Jesus across eight chapters \u2014 the good news itself, repentance and grace, being born again, your new identity and assurance, and beginning with the Bible, with prayer and in a church. It is written for adults starting out, and for anyone still deciding.",
  },
  "talk-before-you-marry": {
    title: "Talk Before You Marry",
    hook: "About to marry, or newly engaged?",
    body:
      "a guide to the nine conversations most couples avoid — money, sex, family, children, faith, roles, past relationships, what each of you is bringing into the marriage, and conflict itself. It gives you the words for each one.",
  },
  "before-you-say-yes": {
    title: "Before You Say Yes",
    hook: "Dating, or wondering whether to be?",
    body:
      "a guide to the red flags Christians spiritualise, the quiet green flags that matter more, boundaries without shame, testing “God told me”, and knowing when to continue, slow down or walk away.",
  },
  "when-your-mind-wont-rest": {
    title: "When Your Mind Won’t Rest",
    hook: "Is your mind refusing to switch off?",
    body:
      "a Christian workbook on overthinking, worry and fear, across twenty chapters with a thirty-day plan and twenty-nine printable worksheets. It will not tell you to stop thinking, or to pray more.",
  },
  "the-christian-spiritual-reset": {
    title: "The Christian Spiritual Reset",
    hook: "Running on empty?",
    body:
      "a three-day guided retreat you take at home — ten sessions with their passages, prayers and silences, seven ready-made schedules, and a workbook. For when the answer is not another book but somewhere to stop.",
  },
  "lead-before-youre-ready": {
    title: "Lead Before You’re Ready",
    hook: "Raising up leaders in your church?",
    body:
      "a practical guide for new church leaders, the ones you are about to hand something to. It covers what to expect in the first year, how to lead people who knew you before the role, and what to do when you are in over your head.",
  },
};

/**
 * Every category must have a default, checked here rather than trusted: a new
 * category added to lib/categories.ts without one would silently take the box
 * away from every article in it.
 */
const missing = CATEGORIES.filter((c) => !BOOK_BY_CATEGORY[c.slug]).map((c) => c.slug);
if (missing.length) {
  throw new Error(
    `lib/book-promo.ts: no default book for category ${missing.join(", ")} — add one to BOOK_BY_CATEGORY.`
  );
}
