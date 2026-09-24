"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/member-gate";
import {
  MIND_COURSE_SLUG,
  findCheckin,
  findPageBySlug,
  readPageFile,
} from "@/lib/mind-course";
import { readQuestions } from "@/lib/mind-slides";
import {
  ACKNOWLEDGEMENT_INDEX,
  CERT_NAME_INDEX,
  CHECKIN_INDEX,
  LEADERS_ACK_INDEX,
  LESSON_QUESTIONS_INDEX,
  INTENTION_INDEX,
  PATTERN_FINDER_INDEX,
  NEXT_STEP_INDEX,
  PATH_INDEX,
  isDayStatus,
  isNextStep,
  type DayStatus,
  type NextStep,
} from "@/lib/mind-progress";
import {
  mindCheckinHref,
  mindDayHref,
  mindJourneyHref,
  mindLeadersHref,
  mindLessonHref,
  MIND_BASE,
} from "@/lib/mind-links";

/**
 * Every action re-checks the membership. A Server Action is reachable by direct
 * POST, so the page having rendered behind a gate is not itself a control — and
 * writes go through the cookie-backed client, so RLS has to agree the row is
 * theirs as well.
 */
async function memberClient() {
  await requireActiveMember();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

/**
 * "Your next faithful step": one of three answers, or none.
 *
 * Private, optional and changeable, and deliberately nothing to do with
 * finishing the lesson — the manifest lists performing the action among the
 * things completion must never depend on. Passing null clears it, because a
 * member who answered "I intend to try this" and then thought better of it
 * should be able to take it back.
 */
export async function saveNextStep(
  lessonSlug: string,
  response: NextStep | null
): Promise<void> {
  if (response !== null && !isNextStep(response)) {
    throw new Error("Unknown response.");
  }
  if (!findPageBySlug(lessonSlug)) throw new Error("Unknown lesson.");

  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: lessonSlug,
      question_index: NEXT_STEP_INDEX,
      answer: response ?? "",
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref(lessonSlug));
}

/**
 * The finish button, and only the finish button.
 *
 * Finishing never depends on the response above, the worksheet, the journal or
 * any check-in. It is also reversible: a member who pressed it and then wanted
 * to sit with the lesson longer can take it back, and nothing is lost.
 */
export async function setLessonFinished(
  lessonSlug: string,
  finished: boolean
): Promise<void> {
  const found = findPageBySlug(lessonSlug);
  if (!found) throw new Error("Unknown lesson.");

  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_progress").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: lessonSlug,
      completed_at: finished ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,course_slug,lesson_slug" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref(lessonSlug));
  revalidatePath(MIND_BASE);
}

/* ------------------------------------------------------- Start Here */

/**
 * The member's chosen path.
 *
 * Optional — a blank path is a valid answer, and clearing it is allowed. The
 * path only changes which order the course suggests. It never resets
 * completion, journal entries, day visits or day statuses, and nothing in this
 * function touches any of those: it writes one row and stops.
 */
export async function saveMindPath(path: string): Promise<void> {
  const { supabase, userId } = await memberClient();

  const page = readPageFile("m0/lessons/02-choose-your-path-and-pace.md");
  const choice = page?.front.choice as { options?: { id: string }[] } | undefined;
  const allowed = new Set((choice?.options ?? []).map((o) => o.id));

  // An unknown id is stored as no path rather than written through.
  const value = allowed.has(path) ? path : "";

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "02-choose-your-path-and-pace",
      question_index: PATH_INDEX,
      answer: value,
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref("02-choose-your-path-and-pace"));
  revalidatePath(MIND_BASE);
}

/**
 * The two intention answers, stored by the stable ids in the page's front
 * matter rather than by position, so reordering the questions later cannot
 * reattach an answer to the wrong prompt.
 *
 * Private and optional: an empty answer is saved as empty and never chased.
 */
export async function saveIntentions(
  answers: Record<string, string>
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const page = readPageFile("m0/lessons/03-before-you-begin.md");
  const intention = page?.front.intention as { questions?: { id: string }[] } | undefined;
  const ids = new Set((intention?.questions ?? []).map((q) => q.id));

  const stored: Record<string, string> = {};
  for (const [id, text] of Object.entries(answers)) {
    if (!ids.has(id)) continue;
    stored[id] = String(text).slice(0, 4000);
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "03-before-you-begin",
      question_index: INTENTION_INDEX,
      answer: JSON.stringify(stored),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref("03-before-you-begin"));
}

/**
 * The three-statement acknowledgement.
 *
 * Only the checked status and the date are stored, as the page's own block
 * specifies — it is not a safety assessment, nothing about the member's state
 * is recorded, and it is excluded from the admin views. It locks nothing: a
 * member who acknowledges none of it keeps the whole course.
 */
export async function saveAcknowledgement(
  checked: Record<string, boolean>
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const page = readPageFile("m0/lessons/04-when-this-course-is-not-enough.md");
  const block = page?.front.acknowledgement as
    | { statements?: { id: string }[] }
    | undefined;
  const ids = (block?.statements ?? []).map((s) => s.id);

  const now = new Date().toISOString();
  const stored: Record<string, { checked: boolean; at: string | null }> = {};
  for (const id of ids) {
    const isChecked = checked[id] === true;
    stored[id] = { checked: isChecked, at: isChecked ? now : null };
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "04-when-this-course-is-not-enough",
      question_index: ACKNOWLEDGEMENT_INDEX,
      answer: JSON.stringify(stored),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref("04-when-this-course-is-not-enough"));
}

/* -------------------------------------------------------- check-ins */

/**
 * A module pause: private notes against the pause's own questions.
 *
 * Unscored, optional, and gating nothing. There are no right answers here and
 * nothing is compared against anything — the rows exist so a member can come
 * back and read what they wrote, and for no other purpose.
 */
export async function saveCheckinAnswers(
  checkinSlug: string,
  answers: Record<string, string>
): Promise<void> {
  const checkin = findCheckin(checkinSlug);
  if (!checkin || checkin.type !== "pause") throw new Error("Unknown check-in.");

  const { supabase, userId } = await memberClient();

  const stored: Record<string, string> = {};
  for (const [key, text] of Object.entries(answers)) {
    if (!/^q\d+$/.test(key)) continue;
    stored[key] = String(text).slice(0, 4000);
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: checkinSlug,
      question_index: CHECKIN_INDEX,
      answer: JSON.stringify(stored),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindCheckinHref(checkinSlug));
}

/**
 * The Pattern Finder.
 *
 * Stores which patterns the member ticked, and nothing else. No score is
 * calculated, no type is derived, and no label is written anywhere — the
 * manifest forbids all three, and a page that tells someone what kind of person
 * they are is the opposite of what this is for. The selections are kept only so
 * the suggestions are still here when they come back.
 */
export async function savePatternFinder(
  checkinSlug: string,
  selected: string[]
): Promise<void> {
  const checkin = findCheckin(checkinSlug);
  if (!checkin || checkin.type !== "pattern_finder") {
    throw new Error("Unknown pattern finder.");
  }

  const { supabase, userId } = await memberClient();

  const known = new Set((checkin.patterns ?? []).map((p) => p.id));
  const ids = [...new Set(selected)].filter((id) => known.has(id));

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: checkinSlug,
      question_index: PATTERN_FINDER_INDEX,
      answer: JSON.stringify({ selected: ids }),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindCheckinHref(checkinSlug));
}

/* ---------------------------------------------------------- leaders */

/**
 * The leaders' acknowledgement.
 *
 * It unlocks the group downloads and nothing else. It generates no
 * certificate, records no approval by Faithful Path, and stores only the tick
 * and the date — the gate page says all three, and this function does no more
 * than it says.
 */
export async function saveLeadersAcknowledgement(checked: boolean): Promise<void> {
  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "leaders",
      question_index: LEADERS_ACK_INDEX,
      answer: JSON.stringify({
        read_safety_and_safeguarding: checked,
        at: checked ? new Date().toISOString() : null,
      }),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLeadersHref());
}

/** The name a member wants on the certificate or the badge. */
export async function saveMindCertificateName(name: string): Promise<void> {
  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: "certificate",
      question_index: CERT_NAME_INDEX,
      answer: name.trim().slice(0, 120),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(MIND_BASE);
}

/* ----------------------------------------------------------- deletion */

/**
 * Erases what the member wrote on one page.
 *
 * Deletion here means the writing is gone, not that the row is gone: the
 * answer is overwritten with nothing, which leaves a row holding no content.
 * course_reflections has no delete policy — deliberately, so that progress
 * cannot be removed out from under a member — and blanking achieves what
 * someone means when they ask to delete what they wrote, without needing one.
 *
 * What survives is the fact a lesson was finished, which is not writing about
 * them and is what the progress count is made of.
 */
export async function eraseMindEntries(pageSlug: string): Promise<void> {
  const { supabase, userId } = await memberClient();

  const { data, error: readError } = await supabase
    .from("course_reflections")
    .select("question_index")
    .eq("course_slug", MIND_COURSE_SLUG)
    .eq("lesson_slug", pageSlug);

  if (readError) throw new Error(readError.message);

  const rows = (data ?? []).map((row) => ({
    user_id: userId,
    course_slug: MIND_COURSE_SLUG,
    lesson_slug: pageSlug,
    question_index: row.question_index as number,
    answer: "",
  }));
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("course_reflections")
    .upsert(rows, { onConflict: "user_id,course_slug,lesson_slug,question_index" });
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref(pageSlug));
  revalidatePath(mindCheckinHref(pageSlug));
  revalidatePath("/members/journal");
}

/* ---------------------------------------------------------- the journey */

/**
 * Records that a day was opened.
 *
 * Idempotent, and deliberately so: `ignoreDuplicates` means visited_at is set
 * once and never moved, because the count a member sees is of days reached,
 * not of times they came back. Opening a day completes nothing — this function
 * cannot write a status, and nothing else calls it.
 */
export async function recordDayVisit(day: number): Promise<void> {
  if (!Number.isInteger(day) || day < 1 || day > 30) return;

  const { supabase, userId } = await memberClient();
  const { error } = await supabase
    .from("course_day_progress")
    .upsert(
      { user_id: userId, course_slug: MIND_COURSE_SLUG, day },
      { onConflict: "user_id,course_slug,day", ignoreDuplicates: true }
    );

  // A visit that could not be recorded must not take the page down with it.
  if (error) console.error("Could not record a journey visit:", error.message);
}

/**
 * Sets or clears a day's status.
 *
 * All four are changeable and clearable; passing null returns the day to
 * opened-with-no-status, which is a real state. "I need support" does not
 * complete the day and notifies nobody — there is no alerting anywhere in this
 * course, and the page says so where the member can read it.
 */
export async function setDayStatus(
  day: number,
  status: DayStatus | null
): Promise<void> {
  if (!Number.isInteger(day) || day < 1 || day > 30) throw new Error("Unknown day.");
  if (status !== null && !isDayStatus(status)) throw new Error("Unknown status.");

  const { supabase, userId } = await memberClient();

  const { error } = await supabase.from("course_day_progress").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      day,
      status,
      status_at: status ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,course_slug,day" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindDayHref(day));
  revalidatePath(mindJourneyHref());
}

/**
 * The questions that follow a lesson's slides.
 *
 * Private, and stored the way every other answer in this course is: the
 * member's own row, read back only by them. Nothing is scored, nothing is
 * required, and leaving them all blank finishes the lesson exactly as well as
 * answering them does.
 *
 * Only ids the lesson actually asks are kept, so a posted body cannot write
 * arbitrary keys into the row.
 */
export async function saveLessonQuestions(
  lessonSlug: string,
  answers: Record<string, string>
): Promise<void> {
  const { supabase, userId } = await memberClient();

  const found = findPageBySlug(lessonSlug);
  const order = found?.page.order;
  if (typeof order !== "number") throw new Error("Unknown lesson.");

  const set = readQuestions(order);
  if (!set) throw new Error("This lesson asks no questions.");
  const ids = new Set(set.questions.map((q) => q.id));

  const stored: Record<string, string> = {};
  for (const [id, text] of Object.entries(answers)) {
    if (!ids.has(id)) continue;
    stored[id] = String(text).slice(0, 4000);
  }

  const { error } = await supabase.from("course_reflections").upsert(
    {
      user_id: userId,
      course_slug: MIND_COURSE_SLUG,
      lesson_slug: lessonSlug,
      question_index: LESSON_QUESTIONS_INDEX,
      answer: JSON.stringify(stored),
    },
    { onConflict: "user_id,course_slug,lesson_slug,question_index" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(mindLessonHref(lessonSlug));
}
