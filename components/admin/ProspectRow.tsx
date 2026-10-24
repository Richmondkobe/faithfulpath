"use client";

import { useRouter } from "next/navigation";

/**
 * A table row that opens the site's detail view when clicked anywhere except
 * on a link inside it (the site's own address). The row also holds an "Open"
 * link, so it works from the keyboard.
 */
export default function ProspectRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        router.push(href);
      }}
      className="cursor-pointer border-b border-line transition-colors hover:bg-paper"
    >
      {children}
    </tr>
  );
}
