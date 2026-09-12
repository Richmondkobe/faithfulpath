import SafetyLink from "@/components/course/SafetyLink";

export const ESV_NOTICE =
  "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.";

/** Carried by every course page: the help link and the Scripture notice. */
export default function CourseFooter({ courseSlug }: { courseSlug: string }) {
  return (
    <footer className="mt-16 border-t border-[#E5D9C7] pt-8">
      <SafetyLink courseSlug={courseSlug} />
      <p className="mt-5 text-xs leading-relaxed text-[#6B5F53]">{ESV_NOTICE}</p>
    </footer>
  );
}
