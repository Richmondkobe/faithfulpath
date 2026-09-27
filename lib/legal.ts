import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The site's legal pages, kept as Markdown in content/legal/.
 *
 * Files rather than Supabase rows, for the same reason the Before You Say Yes
 * resources page is a file: a correction is an ordinary edit and a redeploy,
 * it versions with the code, and the wording that was live on a given date can
 * be recovered from git — which is the point of a page that says "last updated"
 * and makes promises about refunds.
 *
 * Read at module scope, so once per build. All three pages are static.
 */
export type LegalPage = "privacy" | "terms" | "pastoral-terms";

export function readLegal(page: LegalPage): string {
  return readFileSync(join(process.cwd(), "content", "legal", `${page}.md`), "utf8");
}
