import { IBM_Plex_Mono } from "next/font/google";

import "./tbym.css";

// The approved preview sets its small uppercase labels in IBM Plex Mono. The
// site already uses the other two faces from that design — Newsreader for
// display and IBM Plex Sans for text — so this is the only one to add, and it
// is self-hosted by next/font like the others rather than fetched at runtime.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-tbym-mono",
});

/**
 * Chrome every page of this course carries.
 *
 * The footer is not here. This course has two — the short one on lessons, the
 * fuller one on Start Here and Safety and Support — so each page renders the
 * variant it needs through TbymFooter, and verify:tbym checks that every page
 * renders one.
 *
 * Gating is not done here. Every page re-checks the membership for itself,
 * because a layout is not a guard.
 */
export default function TbymLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tbym ${mono.variable} min-h-screen`}>
      {children}

    </div>
  );
}
