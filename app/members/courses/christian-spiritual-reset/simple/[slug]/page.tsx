import { redirect } from "next/navigation";
import { RESET_NEW_PATH } from "@/lib/reset-new";

/** A page of the retired Reset edition's simple layer: sends visitors to the current edition. */
export default function RetiredSimplePage() {
  redirect(RESET_NEW_PATH);
}
