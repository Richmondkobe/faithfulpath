// Check-ins: the four unscored, JSON-driven exercises, and the little rule
// language the content uses to pick which guidance a member is shown.

export type CheckinType = "readiness" | "safety" | "discernment" | "integration";

export type CheckinOption = { id: string; text: string; urgent?: boolean };
export type CheckinSection = {
  id: string;
  type: "multi" | "single";
  question: string;
  options: CheckinOption[];
};

export type Cta = { text: string; lesson?: string; resource?: string };

export type GuidanceRule = {
  id: string;
  when: string;
  heading: string;
  text: string;
  cta?: Cta;
  /** Hide the Next link and show the CTA instead. Readiness "urgent" only. */
  block_continue?: boolean;
  /** Hide the lesson's next-step checkbox. Readiness "urgent" only. */
  hide_action?: boolean;
  /** Swap the primary Next button for the CTA, without locking anything. */
  replace_primary?: boolean;
};

export type IntegrationItem = {
  id: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
};

export type Checkin = {
  type: CheckinType;
  title: string;
  intro?: string;
  notes?: string;
  // readiness + discernment
  sections?: CheckinSection[];
  guidance?: GuidanceRule[];
  priority?: string[];
  repeatable?: boolean;
  // safety
  statements?: string[];
  path?: { question: string; options: CheckinOption[] };
  confirm?: string;
  help_link?: Cta;
  // integration
  items?: IntegrationItem[];
  reflection_prompt?: string;
  closing?: string;
  blank_note?: string;
  available_from?: string;
};

/** What a member has answered: single sections hold a string, multi an array. */
export type CheckinAnswers = Record<string, string | string[]>;
