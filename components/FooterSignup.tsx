"use client";

import { usePathname } from "next/navigation";
import SignupForm from "@/components/SignupForm";
import { BYSY_BASE } from "@/lib/bysy-links";

/**
 * The footer's mailing-list form, everywhere except Before You Say Yes.
 *
 * That course is written for people who may be being monitored, and several of
 * its pages are about recognising coercion or leaving safely. A field asking
 * for a name and an email address at the foot of Lesson 19 is the wrong thing
 * to put there whatever it does with what it collects: it reads as the page
 * asking who you are, on the page where that question is least welcome.
 *
 * Hiding it is done here rather than in the course's own layout because a
 * nested layout cannot remove what a parent layout has already rendered. The
 * whole bordered block goes, not just the fields, so the footer closes up
 * rather than leaving an empty frame where the form was.
 */
export default function FooterSignup() {
  const pathname = usePathname();
  if (pathname?.startsWith(BYSY_BASE)) return null;

  return (
    <div className="mb-10 border-b border-[#E5D9C7] pb-10">
      <SignupForm />
    </div>
  );
}
