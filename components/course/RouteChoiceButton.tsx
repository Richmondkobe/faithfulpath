"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRoute } from "@/app/members/courses/actions";
import type { Route } from "@/lib/course-progress";

/**
 * The "I choose …" links in the route lesson, rendered as buttons. Clicking
 * records the route and then goes where the link pointed, so a member who
 * ignores the buttons and follows the text still ends up in the right place —
 * they just do not get a remembered route.
 */
export default function RouteChoiceButton({
  courseSlug,
  route,
  href,
  children,
  chosen,
}: {
  courseSlug: string;
  route: Route;
  href: string;
  children: React.ReactNode;
  chosen: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <span className="mt-2 block">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await saveRoute(courseSlug, route);
            } catch {
              // The choice is a convenience; never block the member from
              // reading on because saving it failed.
              setError("Your route could not be saved, but you can carry on.");
            }
            router.push(href);
          })
        }
        className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-left text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Saving…" : children}
      </button>
      {chosen && (
        <span className="mt-2 block text-sm text-muted">
          This is your current route.
        </span>
      )}
      {error && (
        <span role="alert" className="mt-2 block text-sm text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
