import Link from "next/link";
import { GUIDELINES_PATH } from "@/lib/community-guidelines";

/** The foot of the signed-in community pages, inside each page's <main>. */
export default function CommunityFooter() {
  return (
    <div className="mt-14">
      <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-6 text-sm text-muted">
        <Link href={GUIDELINES_PATH} className="min-h-11 content-center text-gold-text underline underline-offset-4 hover:text-navy">
          Community Guidelines
        </Link>
        <a href="mailto:info@faithfulpathcommunity.com" className="min-h-11 content-center underline underline-offset-4 hover:text-gold-text">
          Write to Pastor Richmond
        </a>
      </p>
    </div>
  );
}
