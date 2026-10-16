import type { Metadata } from "next";

import { requireActiveMember } from "@/lib/member-gate";
import { readLbyrLesson, requireLbyrPublished } from "@/lib/lbyr-course";
import LbyrShell from "@/components/lbyr/LbyrShell";
import ConcernsCareAndReporting from "@/components/lbyr/ConcernsCareAndReporting";

export const metadata: Metadata = {
  title: "Concerns, Care and Reporting | Lead Before You’re Ready",
  robots: { index: false, follow: false },
};

/** The September edition's page. Its content is shared with the new edition's (components/lbyr/ConcernsCareAndReporting.tsx). */
export default async function LbyrConcerns() {
  await requireActiveMember();
  requireLbyrPublished();

  const notice = readLbyrLesson(1).notice;

  return (
    <LbyrShell notice={notice}>
      <ConcernsCareAndReporting />
    </LbyrShell>
  );
}
