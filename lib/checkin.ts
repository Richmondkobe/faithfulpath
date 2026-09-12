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

/* ------------------------------------------------------------------ rules */

/**
 * The rule language, as the README defines it:
 *
 *   <section>_has:a,b        any of those options ticked   (multi)
 *   <section>_not:a,b        none of those ticked          (multi)
 *   <section>_in:a,b         the single answer is one of   (single)
 *   <section>_count_gte:N    at least N ticked             (multi)
 *   otherwise                always true
 *
 * combined with AND, OR and parentheses. AND binds tighter than OR, which only
 * matters for an expression the content does not currently write without
 * brackets — but getting it wrong silently would pick the wrong guidance, so it
 * is implemented rather than assumed.
 */
type Token = { kind: "op"; value: "AND" | "OR" } | { kind: "paren"; value: "(" | ")" } | { kind: "term"; value: string };

function tokenise(expr: string): Token[] {
  const out: Token[] = [];
  const re = /\(|\)|\bAND\b|\bOR\b|[A-Za-z0-9_]+:[^\s()]*|otherwise/g;
  for (const m of expr.match(re) ?? []) {
    if (m === "(" || m === ")") out.push({ kind: "paren", value: m });
    else if (m === "AND" || m === "OR") out.push({ kind: "op", value: m });
    else out.push({ kind: "term", value: m });
  }
  return out;
}

function asArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function evaluateTerm(term: string, answers: CheckinAnswers): boolean {
  if (term === "otherwise") return true;

  const [lhs, rhsRaw = ""] = term.split(":");
  const rhs = rhsRaw.split(",").map((v) => v.trim()).filter(Boolean);

  const countGte = lhs.match(/^(.+)_count_gte$/);
  if (countGte) {
    return asArray(answers[countGte[1]]).length >= Number(rhs[0] ?? 0);
  }

  const m = lhs.match(/^(.+)_(has|not|in)$/);
  if (!m) return false;
  const [, section, op] = m;
  const given = asArray(answers[section]);

  if (op === "has") return rhs.some((v) => given.includes(v));
  if (op === "not") return rhs.every((v) => !given.includes(v));
  return given.length > 0 && rhs.includes(given[0]);
}

export function evaluateWhen(expr: string, answers: CheckinAnswers): boolean {
  const tokens = tokenise(expr);
  let pos = 0;

  const peek = () => tokens[pos];
  const parseOr = (): boolean => {
    let value = parseAnd();
    while (peek()?.kind === "op" && (peek() as { value: string }).value === "OR") {
      pos++;
      const right = parseAnd();
      value = value || right;
    }
    return value;
  };
  const parseAnd = (): boolean => {
    let value = parseAtom();
    while (peek()?.kind === "op" && (peek() as { value: string }).value === "AND") {
      pos++;
      const right = parseAtom();
      value = value && right;
    }
    return value;
  };
  const parseAtom = (): boolean => {
    const token = peek();
    if (!token) return false;
    if (token.kind === "paren" && token.value === "(") {
      pos++;
      const value = parseOr();
      if (peek()?.kind === "paren") pos++; // closing
      return value;
    }
    pos++;
    return token.kind === "term" ? evaluateTerm(token.value, answers) : false;
  };

  return parseOr();
}

/**
 * The first rule that matches, taken in `priority` order — not file order, and
 * not "best" match. Priority is what makes a danger answer outrank everything
 * else a member ticked.
 */
export function matchGuidance(
  checkin: Checkin,
  answers: CheckinAnswers
): GuidanceRule | null {
  const rules = checkin.guidance ?? [];
  const order = checkin.priority ?? rules.map((r) => r.id);

  for (const id of order) {
    const rule = rules.find((r) => r.id === id);
    if (rule && evaluateWhen(rule.when, answers)) return rule;
  }
  return null;
}

/** Every section answered? Used to enable the submit button. */
export function isComplete(checkin: Checkin, answers: CheckinAnswers): boolean {
  return (checkin.sections ?? []).every(
    (s) => asArray(answers[s.id]).length > 0
  );
}
