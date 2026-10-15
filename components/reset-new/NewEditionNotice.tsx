import Link from "next/link";
import { RESET_NEW_PATH } from "@/lib/reset-new";

/** The one line on the previous edition's pages (design, section 14). `narrow` matches the lesson pages' width. */
export default function NewEditionNotice({ narrow = false }: { narrow?: boolean }) {
  return (
    <div className={`mx-auto ${narrow ? "max-w-2xl" : "max-w-3xl"} px-6 pt-8`}>
      <p className="rounded-xl border border-gold bg-paper px-4 py-3 text-sm leading-relaxed text-navy">
        A new edition of this course is available.{" "}
        <Link href={RESET_NEW_PATH} className="text-gold-text underline underline-offset-4">
          Open the new edition
        </Link>
        . Everything you have done here stays here.
      </p>
    </div>
  );
}
