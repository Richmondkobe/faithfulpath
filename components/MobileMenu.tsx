"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import AccountLink from "@/components/AccountLink";

/**
 * The menu on phones and tablets: one "Menu" button instead of rows of
 * wrapping links (Richmond, 26 October 2026). The list opens under the bar,
 * pushing the page down rather than covering it, and closes when a link is
 * followed, on Escape, or on the button again.
 */
export default function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const pathname = usePathname();
  const id = useId();
  // Following a link closes it: the menu was opened on another page.
  const isOpen = open && openedOn === pathname;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const link =
    "flex min-h-12 items-center rounded-lg px-3 text-[17px] font-semibold text-sun transition-colors hover:bg-night hover:text-gold";

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => {
          setOpenedOn(pathname);
          setOpen(!isOpen);
        }}
        className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-[15px] font-semibold text-sun transition-colors hover:text-gold"
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {isOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        {isOpen ? "Close" : "Menu"}
      </button>
      <nav id={id} aria-label="Main" hidden={!isOpen} className="basis-full border-t border-sun/15 pt-2 pb-3">
        <ul className="grid gap-1 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={link} aria-current={pathname === item.href ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <AccountLink className={link} />
          </li>
        </ul>
        <Link
          href="/give"
          className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 text-[16px] font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          Give
        </Link>
      </nav>
    </>
  );
}
