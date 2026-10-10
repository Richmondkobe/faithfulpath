import Link from "next/link";
import { RESET_NEW_PATH } from "@/lib/reset-new";

/** The one line on the previous edition's course page (design, section 14). */
export default function NewEditionNotice() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8">
      <p className="rounded-sm border border-[#C9A35A] bg-[#FBF5E8] px-4 py-3 text-sm leading-relaxed text-[#2B2118]">
        A new edition of this course is available.{" "}
        <Link href={RESET_NEW_PATH} className="text-[#8B5E34] underline underline-offset-4">
          Open the new edition
        </Link>
        . Everything you have done here stays here.
      </p>
    </div>
  );
}
